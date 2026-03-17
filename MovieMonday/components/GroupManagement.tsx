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
import { Users, UserPlus, LogOut, UserMinus, Calendar, Mail, Link as LinkIcon, Check } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
  createdAt: string;
}

type ConfirmActionType = "leave" | "remove" | null;

const GroupManagement: React.FC<GroupManagementProps> = (props) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionType>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Invite link modal state
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [inviteLink, setInviteLink] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string>("");

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
      const baseUrl = window.location.origin;

      setInviteLink(`${baseUrl}/groups/join/${data.inviteToken}`);
      setInviteEmail("");
      setEmailSent(false);
      setEmailError("");
      setCopySuccess(false);
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

  const sendInviteEmail = async () => {
    if (!inviteEmail || !group) return;

    setSendingEmail(true);
    setEmailError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/groups/${group.id}/invite-email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: inviteEmail,
            inviteLink,
          }),
        },
      );

      if (response.ok) {
        setEmailSent(true);
        setInviteEmail("");
      } else {
        const data = await response.json();
        setEmailError(data.error || "Failed to send invite email");
      }
    } catch (error) {
      setEmailError("Failed to send invite email");
    } finally {
      setSendingEmail(false);
    }
  };

  const closeInviteModal = () => {
    setShowInviteLinkModal(false);
    setInviteLink("");
    setCopySuccess(false);
    setInviteEmail("");
    setEmailSent(false);
    setEmailError("");
  };

  useEffect(() => {
    fetchUserGroup();
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
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
          <div className="flex items-center gap-1 text-xs text-default-400">
            <Calendar className="h-3 w-3" />
            <span>Since {formatDate(group.createdAt)}</span>
          </div>
        </div>
      </CardHeader>

      <Divider />

      <CardBody className="overflow-y-auto">
        <div className="space-y-1">
          {group.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-default-50"
            >
              <Avatar name={member.username} size="sm" />
              <div className="flex-1">
                <p className="font-medium text-sm">{member.username}</p>
                <p className="text-xs text-default-400">{member.email}</p>
              </div>
              {member.id === group.createdById && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Owner
                </span>
              )}
              {currentUserId === group.createdById &&
                member.id !== group.createdById && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => {
                      setSelectedUserId(member.id);
                      setConfirmAction("remove");
                      setShowConfirmModal(true);
                    }}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
            </div>
          ))}
        </div>

        {/* Leave group button for non-owners */}
        {currentUserId !== group.createdById && (
          <div className="mt-4">
            <Button
              color="danger"
              variant="flat"
              size="sm"
              startContent={<LogOut className="h-4 w-4" />}
              onPress={() => {
                setConfirmAction("leave");
                setShowConfirmModal(true);
              }}
            >
              Leave Group
            </Button>
          </div>
        )}

        {/* Pinned "Add Member" Button */}
        <Divider className="my-3" />
        <div
          className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-default-300 bg-default-50 cursor-pointer hover:bg-default-100 transition-colors"
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

      {/* Invite Link Modal — with optional email send */}
      <Modal isOpen={showInviteLinkModal} onClose={closeInviteModal} size="md">
        <ModalContent>
          <ModalHeader>Invite Someone</ModalHeader>
          <ModalBody>
            <div className="space-y-5">
              {/* Shareable link section */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-default-700 flex items-center gap-1.5">
                  <LinkIcon className="h-4 w-4" />
                  Share invite link
                </p>
                <p className="text-xs text-default-500">
                  Anyone with this link can join your group. Expires in 7 days.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    size="sm"
                    className="flex-1"
                    value={inviteLink}
                  />
                  <Button
                    size="sm"
                    color={copySuccess ? "success" : "primary"}
                    startContent={
                      copySuccess ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <LinkIcon className="h-4 w-4" />
                      )
                    }
                    onPress={copyToClipboard}
                  >
                    {copySuccess ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              <Divider />

              {/* Optional email section */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-default-700 flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  Send invite by email{" "}
                  <span className="text-default-400 font-normal">(optional)</span>
                </p>
                <p className="text-xs text-default-500">
                  We'll email the invite link directly — great for people who
                  don't have an account yet.
                </p>

                {emailSent ? (
                  <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-lg p-3">
                    <Check className="h-4 w-4 shrink-0" />
                    Invite email sent!
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      size="sm"
                      type="email"
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      errorMessage={emailError}
                      isInvalid={!!emailError}
                      className="flex-1"
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        setEmailError("");
                      }}
                    />
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      isLoading={sendingEmail}
                      isDisabled={!inviteEmail}
                      startContent={
                        !sendingEmail ? <Mail className="h-4 w-4" /> : undefined
                      }
                      onPress={sendInviteEmail}
                    >
                      Send
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={closeInviteModal}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm action modal */}
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
    </Card>
  );
};

export default GroupManagement;