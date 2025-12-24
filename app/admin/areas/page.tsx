"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Pencil, Trash2, Table as TableIcon } from "lucide-react";
import type { Area, CreateAreaRequest, UpdateAreaRequest } from "@/lib/api/types";

export default function AreasPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", sort_order: 0 });

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<Area[]>("/admin/areas");
      setAreas(data);
    } catch (error) {
      showToast("Failed to load areas", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: CreateAreaRequest = {
        name: createForm.name.trim(),
        sort_order: createForm.sort_order,
      };
      await apiClient.post<Area>("/admin/areas", data);
      showToast("Area created successfully", "success");
      setShowCreateForm(false);
      setCreateForm({ name: "", sort_order: 0 });
      loadAreas();
    } catch (error: any) {
      showToast(error.message || "Failed to create area", "error");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea) return;
    try {
      const data: UpdateAreaRequest = {
        name: editingArea.name.trim(),
        sort_order: editingArea.sort_order,
      };
      await apiClient.put<Area>(`/admin/areas/${editingArea.id}`, data);
      showToast("Area updated successfully", "success");
      setEditingArea(null);
      loadAreas();
    } catch (error: any) {
      showToast(error.message || "Failed to update area", "error");
    }
  };

  const handleDelete = async (areaId: string) => {
    try {
      await apiClient.delete(`/admin/areas/${areaId}`);
      showToast("Area deleted successfully", "success");
      loadAreas();
    } catch (error: any) {
      showToast(error.message || "Failed to delete area", "error");
    }
  };

  const filteredAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 flex gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Area Management</h1>
            <p className="text-muted-foreground mt-1">Configure floor plans, manage areas, and arrange tables</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Area
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Area</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Area Name</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Main Hall, Terrace"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-sort-order">Sort Order</Label>
                  <Input
                    id="create-sort-order"
                    type="number"
                    min="0"
                    value={createForm.sort_order}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Area</Button>
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
            placeholder="Search areas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Areas List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAreas.map((area) => (
              <Card
                key={area.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => router.push(`/admin/areas/${area.id}/tables`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <Badge variant="outline">Order: {area.sort_order}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TableIcon className="h-4 w-4" />
                      <span>{area.table_count || 0} Tables</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingArea(area);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(area.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredAreas.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No areas found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Sidebar */}
      {editingArea && (
        <div className="w-80 border-l border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Edit Area</h2>
              <p className="text-sm text-muted-foreground">Properties for {editingArea.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setEditingArea(null)}>
              ×
            </Button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Area Name</Label>
              <Input
                id="edit-name"
                value={editingArea.name}
                onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sort-order">Sort Order</Label>
              <Input
                id="edit-sort-order"
                type="number"
                min="0"
                value={editingArea.sort_order}
                onChange={(e) =>
                  setEditingArea({
                    ...editingArea,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Update Area</Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  handleDelete(editingArea.id);
                  setEditingArea(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

