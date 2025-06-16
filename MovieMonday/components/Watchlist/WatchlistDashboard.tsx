// MovieMonday/components/Watchlist/WatchlistDashboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Switch,
  useDisclosure,
} from "@heroui/react";
import { Plus, List } from "lucide-react";
import { useRouter } from "next/navigation";

import WatchlistCard from "./WatchlistCard";

import { useAuth } from "@/contexts/AuthContext";

interface WatchlistCategory {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  likesCount: number;
  coverImagePath?: string;
  slug: string;
  moviesCount: number;
  createdAt: string;
  updatedAt: string;
}

const WatchlistDashboard: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [watchlists, setWatchlists] = useState<WatchlistCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });
  const [editMode, setEditMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  // Fetch watchlists
  useEffect(() => {
    fetchWatchlists();
  }, [token]);

  const fetchWatchlists = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/watchlists/categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        setWatchlists(data);
      } else {
        console.error("Failed to fetch watchlists");
      }
    } catch (error) {
      console.error("Error fetching watchlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateWatchlist = async () => {
    if (!token) return;

    if (!formData.name.trim()) {
      setFormError("Watchlist name is required");

      return;
    }

    setSubmitLoading(true);
    setFormError("");

    try {
      const endpoint =
        editMode && currentEditId
          ? `${API_BASE_URL}/api/watchlists/categories/${currentEditId}`
          : `${API_BASE_URL}/api/watchlists/categories`;

      const method = editMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Success - close modal and refresh
        onClose();
        fetchWatchlists();
        resetForm();
      } else {
        const errorData = await response.json();

        setFormError(errorData.message || "Failed to create watchlist");
      }
    } catch (error) {
      console.error("Error creating/updating watchlist:", error);
      setFormError("An unexpected error occurred");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditWatchlist = (watchlist: WatchlistCategory) => {
    setFormData({
      name: watchlist.name,
      description: watchlist.description || "",
      isPublic: watchlist.isPublic,
    });
    setCurrentEditId(watchlist.id);
    setEditMode(true);
    onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!token || confirmDeleteId === null) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/watchlists/categories/${confirmDeleteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Success - refresh list
        fetchWatchlists();
        setShowDeleteModal(false);
        setConfirmDeleteId(null);
      } else {
        const errorData = await response.json();

        console.error("Failed to delete watchlist:", errorData.message);
      }
    } catch (error) {
      console.error("Error deleting watchlist:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isPublic: false,
    });
    setEditMode(false);
    setCurrentEditId(null);
    setFormError("");
  };

  const handleOpenCreateModal = () => {
    resetForm();
    onOpen();
  };

  const handleViewWatchlist = (id: number, slug: string) => {
    router.push(`/watchlist/${slug}`);
  };

  const handleShareWatchlist = (watchlist: WatchlistCategory) => {
    if (!watchlist.isPublic) {
      alert("Make this watchlist public first to share it.");

      return;
    }

    // Create a shareable URL
    const shareUrl = `${window.location.origin}/watchlist/${watchlist.slug}`;

    // Use the Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: watchlist.name,
          text:
            watchlist.description ||
            `Check out this watchlist: ${watchlist.name}`,
          url: shareUrl,
        })
        .catch((error) => {
          console.log("Error sharing:", error);
          // Fallback to copying to clipboard
          copyToClipboard(shareUrl);
        });
    } else {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Watchlists</h2>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onPress={handleOpenCreateModal}
        >
          Create Watchlist
        </Button>
      </div>

      {watchlists.length === 0 ? (
        <Card>
          <CardBody className="py-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <List className="text-default-300" size={48} />
              <h3 className="text-xl font-medium">No watchlists yet</h3>
              <p className="text-default-500">
                Create your first watchlist to start organizing your movies
              </p>
              <Button
                color="primary"
                startContent={<Plus size={16} />}
                onPress={handleOpenCreateModal}
              >
                Create Watchlist
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlists.map((watchlist) => (
            <WatchlistCard
              key={watchlist.id}
              watchlist={watchlist}
              onDelete={() => {
                setConfirmDeleteId(watchlist.id);
                setShowDeleteModal(true);
              }}
              onEdit={() => handleEditWatchlist(watchlist)}
              onShare={() => handleShareWatchlist(watchlist)}
              onView={() => handleViewWatchlist(watchlist.id, watchlist.slug)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Watchlist Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editMode ? "Edit Watchlist" : "Create Watchlist"}
          </ModalHeader>
          <ModalBody>
            {formError && (
              <div className="bg-danger-50 text-danger p-2 rounded mb-4 text-sm">
                {formError}
              </div>
            )}
            <div className="space-y-4">
              <Input
                isRequired
                label="Watchlist Name"
                name="name"
                placeholder="My Favorite Movies"
                value={formData.name}
                onChange={handleInputChange}
              />
              <Input
                label="Description (optional)"
                name="description"
                placeholder="A collection of movies I love"
                value={formData.description}
                onChange={handleInputChange}
              />
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={formData.isPublic}
                  name="isPublic"
                  onValueChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isPublic: checked }))
                  }
                />
                <div>
                  <span className="text-sm">Make this watchlist public</span>
                  <p className="text-xs text-default-500">
                    Public watchlists can be seen and liked by other users
                  </p>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                onClose();
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isLoading={submitLoading}
              onPress={handleCreateWatchlist}
            >
              {editMode ? "Save Changes" : "Create Watchlist"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalContent>
          <ModalHeader>Delete Watchlist</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete this watchlist? This action cannot
              be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeleteConfirm}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default WatchlistDashboard;
