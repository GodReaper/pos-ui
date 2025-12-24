"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, MapPin, Trash2, X } from "lucide-react";
import type { User, CreateBillerRequest, Area, Assignment, CreateAssignmentRequest } from "@/lib/api/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", password: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, areasData, assignmentsData] = await Promise.all([
        apiClient.get<User[]>("/admin/users"),
        apiClient.get<Area[]>("/admin/areas"),
        apiClient.get<Assignment[]>("/admin/assignments").catch(() => []), // Optional, may not exist
      ]);
      setUsers(usersData);
      setAreas(areasData);
      setAssignments(assignmentsData || []);
    } catch (error) {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: CreateBillerRequest = {
        username: createForm.username.trim(),
        password: createForm.password,
        role: "biller",
        is_active: true,
      };
      await apiClient.post<User>("/admin/users", data);
      showToast("User created successfully", "success");
      setShowCreateForm(false);
      setCreateForm({ username: "", password: "" });
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to create user", "error");
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await apiClient.put(`/admin/users/${user.id}`, { is_active: !user.is_active });
      showToast(`User ${!user.is_active ? "activated" : "deactivated"}`, "success");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to update user", "error");
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      showToast("User deleted successfully", "success");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to delete user", "error");
    }
  };

  const handleAssignAreas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningUser) return;
    try {
      const data: CreateAssignmentRequest = {
        biller_id: assigningUser.id,
        area_ids: selectedAreaIds,
      };
      await apiClient.post<Assignment>("/admin/assign", data);
      showToast("Areas assigned successfully", "success");
      setAssigningUser(null);
      setSelectedAreaIds([]);
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to assign areas", "error");
    }
  };

  const getAssignedAreas = (userId: string): Area[] => {
    const assignment = assignments.find((a) => a.biller_id === userId);
    if (!assignment) return [];
    return areas.filter((area) => assignment.area_ids.includes(area.id));
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Only show billers for assignment, but display all users
  const billers = filteredUsers.filter((user) => user.role === "biller");
  const admins = filteredUsers.filter((user) => user.role === "admin");

  return (
    <div className="p-8 flex gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-1">Manage users and assign areas to billers</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Biller
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Biller</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={createForm.username}
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Enter password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Biller</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Billers List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            {billers.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Billers</h2>
                <div className="space-y-3">
                  {billers.map((user) => {
                    const assignedAreas = getAssignedAreas(user.id);
                    return (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-semibold">{user.username[0].toUpperCase()}</span>
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold">{user.username}</div>
                                <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}</div>
                                {assignedAreas.length > 0 && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <div className="flex flex-wrap gap-1">
                                      {assignedAreas.map((area) => (
                                        <Badge key={area.id} variant="outline" className="text-xs">
                                          {area.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {assignedAreas.length === 0 && (
                                  <div className="text-xs text-muted-foreground mt-2">No areas assigned</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={user.is_active ? "default" : "secondary"}>
                                {user.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline">Biller</Badge>
                              <Switch checked={user.is_active} onChange={() => handleToggleActive(user)} />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const assignment = assignments.find((a) => a.biller_id === user.id);
                                  setSelectedAreaIds(assignment?.area_ids || []);
                                  setAssigningUser(user);
                                }}
                              >
                                <MapPin className="h-4 w-4 mr-2" />
                                Assign Areas
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admins List */}
            {admins.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Admins</h2>
                <div className="space-y-3">
                  {admins.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-semibold">{user.username[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <div className="font-semibold">{user.username}</div>
                              <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="default">Admin</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No users found</div>
            )}
          </div>
        )}
      </div>

      {/* Assignment Sidebar */}
      {assigningUser && (
        <div className="w-80 border-l border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Assign Areas</h2>
              <p className="text-sm text-muted-foreground">Assign areas to {assigningUser.username}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setAssigningUser(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleAssignAreas} className="space-y-4">
            <div className="space-y-3">
              <Label>Select Areas</Label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {areas.map((area) => (
                  <label
                    key={area.id}
                    className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent cursor-pointer touch-manipulation"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAreaIds.includes(area.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAreaIds([...selectedAreaIds, area.id]);
                        } else {
                          setSelectedAreaIds(selectedAreaIds.filter((id) => id !== area.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{area.name}</div>
                    </div>
                  </label>
                ))}
                {areas.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No areas available. Create areas first.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <Button type="submit" className="flex-1">
                Save Assignment
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAssigningUser(null);
                  setSelectedAreaIds([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
