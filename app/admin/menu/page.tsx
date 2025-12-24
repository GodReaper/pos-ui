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
import { Plus, Search, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import type {
  Category,
  MenuItem,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
} from "@/lib/api/types";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateItem, setShowCreateItem] = useState(false);
      const [createCategoryForm, setCreateCategoryForm] = useState({ name: "", sort_order: 0 });
  const [createItemForm, setCreateItemForm] = useState({
    name: "",
    price: "0.00",
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, itemsData] = await Promise.all([
        apiClient.get<Category[]>("/menu/admin/categories"),
        apiClient.get<MenuItem[]>("/menu/admin/items"),
      ]);
      setCategories(categoriesData);
      setItems(itemsData);
      if (categoriesData.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(categoriesData[0].id);
      }
    } catch (error) {
      showToast("Failed to load menu data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: CreateCategoryRequest = {
        name: createCategoryForm.name.trim(),
        sort_order: createCategoryForm.sort_order,
      };
      const newCategory = await apiClient.post<Category>("/menu/admin/categories", data);
      showToast("Category created successfully", "success");
      setShowCreateCategory(false);
      setCreateCategoryForm({ name: "", sort_order: 0 });
      loadData();
      setSelectedCategoryId(newCategory.id);
    } catch (error: any) {
      showToast(error.message || "Failed to create category", "error");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const data: UpdateCategoryRequest = {
        name: editingCategory.name.trim(),
        sort_order: editingCategory.sort_order,
      };
      await apiClient.put<Category>(`/menu/admin/categories/${editingCategory.id}`, data);
      showToast("Category updated successfully", "success");
      setEditingCategory(null);
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to update category", "error");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await apiClient.delete(`/menu/admin/categories/${categoryId}`);
      showToast("Category deleted successfully", "success");
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(categories.find((c) => c.id !== categoryId)?.id || null);
      }
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to delete category", "error");
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      showToast("Please select a category first", "error");
      return;
    }
    try {
      const data: CreateMenuItemRequest = {
        category_id: selectedCategoryId,
        name: createItemForm.name.trim(),
        price: parseFloat(createItemForm.price),
        is_active: createItemForm.is_active,
      };
      await apiClient.post<MenuItem>(`/menu/admin/items`, data);
      showToast("Item created successfully", "success");
      setShowCreateItem(false);
      setCreateItemForm({
        name: "",
        price: "0.00",
        is_active: true,
      });
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to create item", "error");
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const data: UpdateMenuItemRequest = {
        name: editingItem.name.trim(),
        price: editingItem.price,
        is_active: editingItem.is_active,
      };
      await apiClient.put<MenuItem>(
        `/menu/admin/items/${editingItem.id}`,
        data
      );
      showToast("Item updated successfully", "success");
      setEditingItem(null);
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to update item", "error");
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    try {
      await apiClient.delete(`/menu/admin/items/${item.id}`);
      showToast("Item deleted successfully", "success");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to delete item", "error");
    }
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      await apiClient.put<MenuItem>(
        `/menu/admin/items/${item.id}`,
        { is_active: !item.is_active }
      );
      showToast(`Item ${!item.is_active ? "enabled" : "disabled"}`, "success");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to update item", "error");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = !selectedCategoryId || item.category_id === selectedCategoryId;
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="p-8 flex gap-6">
      {/* Categories Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Categories</h2>
          <p className="text-sm text-muted-foreground mb-4">Manage menu sections</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowCreateCategory(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Category
          </Button>
        </div>

        {/* Create Category Form */}
        {showCreateCategory && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Add New Category</h3>
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input
                    id="cat-name"
                    value={createCategoryForm.name}
                    onChange={(e) =>
                      setCreateCategoryForm({ ...createCategoryForm, name: e.target.value })
                    }
                    placeholder="e.g. Mains"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-sort-order">Sort Order</Label>
                  <Input
                    id="cat-sort-order"
                    type="number"
                    min="0"
                    value={createCategoryForm.sort_order}
                    onChange={(e) =>
                      setCreateCategoryForm({
                        ...createCategoryForm,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1">
                    Create
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateCategory(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Categories List */}
        <div className="space-y-2">
          {categories.map((category) => (
            <Card
              key={category.id}
              className={`cursor-pointer transition-colors ${
                selectedCategoryId === category.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{category.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {category.item_count || 0} Items
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(category);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content - Items */}
      <div className="flex-1">
        {selectedCategory && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{selectedCategory.name}</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your {selectedCategory.name.toLowerCase()} items
                </p>
              </div>
              <Button onClick={() => setShowCreateItem(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </Button>
            </div>

            {/* Create Item Form */}
            {showCreateItem && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Add New Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateItem} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="item-name">Item Name</Label>
                        <Input
                          id="item-name"
                          value={createItemForm.name}
                          onChange={(e) =>
                            setCreateItemForm({ ...createItemForm, name: e.target.value })
                          }
                          placeholder="e.g. Truffle Burger"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="item-price">Price ($)</Label>
                        <Input
                          id="item-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={createItemForm.price}
                          onChange={(e) =>
                            setCreateItemForm({ ...createItemForm, price: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="item-active">Active</Label>
                      <Switch
                        id="item-active"
                        checked={createItemForm.is_active}
                        onChange={(checked) =>
                          setCreateItemForm({
                            ...createItemForm,
                            is_active: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Save Item</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateItem(false)}
                      >
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
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Items Grid */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          ${item.price.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.is_active}
                            onChange={() => handleToggleItemAvailability(item)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {item.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingItem(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredItems.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No items found
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!selectedCategory && categories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Create a category to get started
          </div>
        )}
      </div>

      {/* Edit Category Sidebar */}
      {editingCategory && (
        <div className="w-80 border-l border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Edit Category</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setEditingCategory(null)}>
              ×
            </Button>
          </div>

          <form onSubmit={handleUpdateCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cat-name">Name</Label>
              <Input
                id="edit-cat-name"
                value={editingCategory.name}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cat-sort-order">Sort Order</Label>
              <Input
                id="edit-cat-sort-order"
                type="number"
                min="0"
                value={editingCategory.sort_order}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Update Category
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  handleDeleteCategory(editingCategory.id);
                  setEditingCategory(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Item Sidebar */}
      {editingItem && (
        <div className="w-80 border-l border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Edit Item</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setEditingItem(null)}>
              ×
            </Button>
          </div>

          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-item-name">Item Name</Label>
              <Input
                id="edit-item-name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-price">Price ($)</Label>
              <Input
                id="edit-item-price"
                type="number"
                step="0.01"
                min="0"
                value={editingItem.price}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={editingItem.is_active}
                onChange={(checked) =>
                  setEditingItem({ ...editingItem, is_active: checked })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Update Item
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  handleDeleteItem(editingItem);
                  setEditingItem(null);
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

