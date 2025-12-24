"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import type { Table, CreateTableRequest, UpdateTableRequest, Area } from "@/lib/api/types";

export default function TablesPage() {
  const router = useRouter();
  const params = useParams();
  const areaId = params.areaId as string;

  const [area, setArea] = useState<Area | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    capacity: 4,
    status: "available" as const,
    position: { x: 0, y: 0 },
  });

  useEffect(() => {
    if (areaId) {
      loadData();
    }
  }, [areaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [areaData, tablesData] = await Promise.all([
        apiClient.get<Area>(`/admin/areas/${areaId}`),
        apiClient.get<Table[]>(`/admin/areas/${areaId}/tables`),
      ]);
      setArea(areaData);
      setTables(tablesData);
    } catch (error) {
      showToast("Failed to load tables", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: CreateTableRequest = {
        name: createForm.name.trim(),
        capacity: createForm.capacity || undefined,
        status: createForm.status,
        position: createForm.position.x !== 0 || createForm.position.y !== 0 ? createForm.position : undefined,
      };
      await apiClient.post<Table>(`/admin/areas/${areaId}/tables`, data);
      showToast("Table created successfully", "success");
      setShowCreateForm(false);
      setCreateForm({ name: "", capacity: 4, status: "available", position: { x: 0, y: 0 } });
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to create table", "error");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    try {
      const data: UpdateTableRequest = {
        name: selectedTable.name.trim(),
        capacity: selectedTable.capacity,
        status: selectedTable.status,
        position: selectedTable.position,
      };
      await apiClient.put<Table>(`/admin/areas/${areaId}/tables/${selectedTable.id}`, data);
      showToast("Table updated successfully", "success");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to update table", "error");
    }
  };

  const handleDelete = async (tableId: string) => {
    try {
      await apiClient.delete(`/admin/areas/${areaId}/tables/${tableId}`);
      showToast("Table deleted successfully", "success");
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
      }
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to delete table", "error");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default";
      case "occupied":
        return "secondary";
      case "reserved":
        return "outline";
      case "out_of_order":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-8 flex gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin/areas")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{area?.name || "Tables"}</h1>
              <p className="text-muted-foreground mt-1">
                Showing {tables.length} tables in {area?.name}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Table
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add New Table</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Table Name</Label>
                    <Input
                      id="create-name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g. Table 1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-capacity">Capacity</Label>
                    <Input
                      id="create-capacity"
                      type="number"
                      min="1"
                      value={createForm.capacity}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, capacity: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-status">Status</Label>
                  <div className="flex gap-2">
                    {(["available", "occupied", "reserved", "out_of_order"] as const).map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant={createForm.status === status ? "default" : "outline"}
                        onClick={() => setCreateForm({ ...createForm, status })}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Create Table</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tables Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all ${
                  selectedTable?.id === table.id
                    ? "border-primary ring-2 ring-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedTable(table)}
              >
                <CardContent className="p-4 text-center">
                  <div className="font-semibold text-sm mb-2">{table.name}</div>
                  {table.capacity && (
                    <div className="text-xs text-muted-foreground mb-2">{table.capacity} Seats</div>
                  )}
                  <Badge variant={getStatusBadgeVariant(table.status)} className="text-xs">
                    {table.status.replace("_", " ")}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {tables.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No tables found. Create your first table.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Sidebar */}
      {selectedTable && (
        <div className="w-80 border-l border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Edit Table</h2>
              <p className="text-sm text-muted-foreground">Properties for {selectedTable.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedTable(null)}>
              ×
            </Button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Table Name</Label>
              <Input
                id="edit-name"
                value={selectedTable.name}
                onChange={(e) => setSelectedTable({ ...selectedTable, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                value={selectedTable.capacity || ""}
                onChange={(e) =>
                  setSelectedTable({
                    ...selectedTable,
                    capacity: parseInt(e.target.value) || undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <div className="flex flex-wrap gap-2">
                {(["available", "occupied", "reserved", "out_of_order"] as const).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={selectedTable.status === status ? "default" : "outline"}
                    onClick={() => setSelectedTable({ ...selectedTable, status })}
                    className="text-xs"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Update Table
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  handleDelete(selectedTable.id);
                  setSelectedTable(null);
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
