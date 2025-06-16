import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
  Avatar,
} from "@heroui/react";
import { Users, UserPlus, LogOut, UserMinus, Calendar } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Define interfaces for our types
interface GroupMember {
  id: string;
  username: string;
  email: string;
}

interface GroupManagementProps {
  onGroupUpdate?: () => void;
}

interface Group {
  id: string;
  name: string;
  createdById: string;
  members: GroupMember[];
  createdAt: string; // Add createdAt property
}

type ConfirmActionType = "leave" | "remove" | null;

const GroupManagement: React.FC<GroupManagementProps> = (props) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionType>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [inviteLink, setInviteLink] = useState<string>("");
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const generateInviteLink = async () => {
    if (!group) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/groups/${group.id}/invite-link`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );
      const data = await response.json();
      // Construct the full URL on the frontend
      const baseUrl = window.location.origin;

      setInviteLink(`${baseUrl}/groups/join/${data.inviteToken}`);
      setShowInviteLinkModal(true);
    } catch (error) {
      console.error("Error generating invite link:", error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  useEffect(() => {
    fetchUserGroup();
    // For debugging the date format
    if (group?.createdAt) {
      console.log("Group creation date:", group.createdAt);
    }
  }, []);

  const fetchUserGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/users/group`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data: Group = await response.json();

      setGroup(data);

      if (token) {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));

        setCurrentUserId(decodedToken.id);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching group:", error);
      setLoading(false);
    }
  };

  const createGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/groups`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: groupName }),
      });
      const data: Group = await response.json();

      setShowCreateModal(false);
      setGroupName("");
      setGroup(data);

      if (props.onGroupUpdate) {
        props.onGroupUpdate();
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const leaveGroup = async () => {
    if (!group) return;

    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_BASE_URL}/api/groups/${group.id}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      // Refresh the group data or redirect if needed
      setGroup(null);

      if (props.onGroupUpdate) {
        props.onGroupUpdate();
      }
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const removeMember = async (userId: string) => {
    if (!group) return;

    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_BASE_URL}/api/groups/${group.id}/members/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      await fetchUserGroup();

      if (props.onGroupUpdate) {
        props.onGroupUpdate();
      }
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === "leave") {
      leaveGroup();
    } else if (confirmAction === "remove" && selectedUserId) {
      removeMember(selectedUserId);
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setSelectedUserId(null);
  };

  const inviteUser = async () => {
    if (!group) return;

    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_BASE_URL}/api/groups/${group.id}/invites`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ invitedUserEmail: inviteEmail }),
      });
      setShowInviteModal(false);
      setInviteEmail("");
      await fetchUserGroup();

      if (props.onGroupUpdate) {
        props.onGroupUpdate();
      }
    } catch (error) {
      console.error("Error inviting user:", error);
    }
  };

  // Format date function for displaying createdAt
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      // Handle PostgreSQL timestamp format
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return "Unknown";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error parsing date:", error);

      return "Unknown";
    }
  };

  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardBody className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardBody>
      </Card>
    );
  }

  if (!group) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="flex flex-col gap-2">
          <h3 className="text-xl font-bold">Your Group</h3>
          <p className="text-sm text-default-500">
            Create or join a group to get started
          </p>
        </CardHeader>
        <CardBody className="flex flex-col items-center justify-center gap-4 py-8">
          <Users className="h-12 w-12 text-default-300" />
          <p className="text-center text-default-500">
            No group found. Create a new group to start planning your Movie
            Mondays.
          </p>
          <Button
            color="primary"
            startContent={<UserPlus className="h-4 w-4" />}
            onPress={() => setShowCreateModal(true)}
          >
            Create Group
          </Button>

          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          >
            <ModalContent>
              <ModalHeader>Create a New Group</ModalHeader>
              <ModalBody>
                <Input
                  label="Group Name"
                  placeholder="Enter your group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button color="primary" onPress={createGroup}>
                  Create
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex-col justify-between items-start">
        <div className="flex items-start">
          <h3 className="text-xl font-bold">{group.name}</h3>
        </div>
        <div className="flex justify-between h-full w-full items-end gap-2">
          <p className="text-sm text-default-500">
            {group.members?.length || 0} member
            {group.members?.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2 ">
            <Calendar className="h-4 w-4 text-default-400" />
            <span className="text-xs text-default-400">
              Created: {formatDate(group.createdAt)}
            </span>
          </div>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="flex flex-col h-64 overflow-hidden">
        {/* Scrollable member list */}
        <div className="flex-grow overflow-y-auto pr-1">
          <div className="flex flex-col gap-3">
            {/* Group Owner Label */}
            <p className="text-xs font-medium text-default-500 uppercase tracking-wider mt-2">
              Owner
            </p>

            {/* List Owner First */}
            {group.members
              ?.filter((member) => member.id === group.createdById)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-default-100"
                >
                  <Avatar
                    isBordered
                    className="h-10 w-10"
                    color="primary"
                    name={member.username.charAt(0).toUpperCase()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.username}</p>
                    <p className="text-xs text-default-500">{member.email}</p>
                  </div>
                </div>
              ))}

            {/* Members Label */}
            {group.members?.some(
              (member) => member.id !== group.createdById,
            ) && (
              <p className="text-xs font-medium text-default-500 uppercase tracking-wider mt-4">
                Members
              </p>
            )}

            {/* List Other Members */}
            {group.members
              ?.filter((member) => member.id !== group.createdById)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-default-100"
                >
                  <Avatar
                    className="h-10 w-10"
                    name={member.username.charAt(0).toUpperCase()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.username}</p>
                    <p className="text-xs text-default-500">{member.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {group.createdById === currentUserId && (
                      <Button
                        isIconOnly
                        color="danger"
                        variant="light"
                        onPress={() => {
                          setConfirmAction("remove");
                          setSelectedUserId(member.id);
                          setShowConfirmModal(true);
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                    {member.id === currentUserId && (
                      <Button
                        color="danger"
                        endContent={<LogOut className="h-4 w-4" />}
                        size="sm"
                        variant="light"
                        onPress={() => {
                          setConfirmAction("leave");
                          setShowConfirmModal(true);
                        }}
                      >
                        Leave
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Pinned "Add Member" Button - Always visible at bottom */}
        <Divider className="my-3" />
        <div
          className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-default-300 bg-default-50 cursor-pointer"
          onClick={generateInviteLink}
        >
          <div className="h-10 w-10 rounded-full bg-default-100 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-default-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-default-600">Add member</p>
            <p className="text-xs text-default-500">
              Invite someone to join your group
            </p>
          </div>
        </div>
      </CardBody>

      {/* Modals */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)}>
        <ModalContent>
          <ModalHeader>Invite Member</ModalHeader>
          <ModalBody>
            <Input
              label="Email Address"
              placeholder="Enter their email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={inviteUser}>
              Send Invite
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
          setSelectedUserId(null);
        }}
      >
        <ModalContent>
          <ModalHeader>
            {confirmAction === "leave" ? "Leave Group" : "Remove Member"}
          </ModalHeader>
          <ModalBody>
            <p>
              {confirmAction === "leave"
                ? "Are you sure you want to leave this group?"
                : "Are you sure you want to remove this member?"}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setShowConfirmModal(false);
                setConfirmAction(null);
                setSelectedUserId(null);
              }}
            >
              Cancel
            </Button>
            <Button color="danger" onPress={handleConfirmAction}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showInviteLinkModal}
        onClose={() => {
          setShowInviteLinkModal(false);
          setInviteLink("");
          setCopySuccess(false);
        }}
      >
        <ModalContent>
          <ModalHeader>Share Invite Link</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                Share this link with others to invite them to your group. The
                link will expire in 7 days.
              </p>
              <div className="flex items-center gap-2">
                <Input readOnly className="flex-1" value={inviteLink} />
                <Button
                  color={copySuccess ? "success" : "primary"}
                  onPress={copyToClipboard}
                >
                  {copySuccess ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setShowInviteLinkModal(false);
                setInviteLink("");
                setCopySuccess(false);
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default GroupManagement;
