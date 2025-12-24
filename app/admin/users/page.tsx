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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { BillerUser, CreateBillerRequest, Area } from "@/lib/api/types";

export default function UsersPage() {
  const [users, setUsers] = useState<BillerUser[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<BillerUser | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", password: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, areasData] = await Promise.all([
        apiClient.get<BillerUser[]>("/admin/users"),
        apiClient.get<Area[]>("/admin/areas"),
      ]);
      setUsers(usersData);
      setAreas(areasData);
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
      await apiClient.post<BillerUser>("/admin/users", data);
      showToast("User created successfully", "success");
      setShowCreateForm(false);
      setCreateForm({ username: "", password: "" });
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to create user", "error");
    }
  };

  const handleToggleActive = async (user: BillerUser) => {
    try {
      await apiClient.patch(`/admin/users/${user.id}`, { is_active: !user.is_active });
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

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage biller users and access</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
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
                <Button type="submit">Create User</Button>
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

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
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
                    <Badge variant="outline">Biller</Badge>
                    <Switch
                      checked={user.is_active}
                      onChange={() => handleToggleActive(user)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}

