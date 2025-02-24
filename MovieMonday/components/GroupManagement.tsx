import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  Users,
  UserPlus,
  Link as LinkIcon,
  LogOut,
  UserMinus,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

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
    const response = await fetch(`${API_BASE_URL}/api/groups/${group.id}/invite-link`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
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
  }, []);

  const fetchUserGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token:", token);
      const response = await fetch(`${API_BASE_URL}/api/users/group`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data: Group = await response.json();
      console.log("Group data:", data);
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

  if (loading) {
    return (
      <Card className="w-full">
        <CardBody className="space-y-4">
          <div className="w-full flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!group) {
    return (
      <Card className="w-full">
        <CardBody className="space-y-4">
          <div className="w-full flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold">No Group Yet</p>
              <p className="text-sm text-gray-500">
                Create a group to get started
              </p>
            </div>
            <Button
              color="primary"
              endContent={<Users className="h-4 w-4" />}
              onPress={() => setShowCreateModal(true)}
            >
              Create Group
            </Button>
          </div>

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
    <Card className="w-full">
      <CardBody className="space-y-4">
        <div className="w-full flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">{group.name}</p>
            <div
              className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer"
              onClick={generateInviteLink}
            >
              <LinkIcon className="h-4 w-4" />
              <p>Share invite link</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold">{group.members?.length || 0}</p>
              <p className="text-sm text-gray-500">Members</p>
            </div>
            <Button
              color="primary"
              endContent={<UserPlus className="h-4 w-4" />}
              onPress={generateInviteLink}
            >
              Invite
            </Button>
          </div>
        </div>

        <div className="w-1/2 space-y-2">
          {group.members?.map((member) => (
            <div
              key={member.id}
              className="w-full flex items-center space-x-2 p-2 bg-zinc-800 rounded-lg"
            >
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1">
                <p className="text-sm font-medium">{member.username}</p>
                {member.id === group.createdById && (
                  <p className="text-xs text-gray-500">Owner</p>
                )}
              </div>
              {member.id !== group.createdById && (
                <div className="flex gap-2">
                  {group.createdById === currentUserId && (
                    <Button
                      color="danger"
                      variant="light"
                      isIconOnly
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
                      variant="light"
                      size="sm"
                      endContent={<LogOut className="h-4 w-4" />}
                      onPress={() => {
                        setConfirmAction("leave");
                        setShowConfirmModal(true);
                      }}
                    >
                      Leave
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        >
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
                <p className="text-sm text-gray-600">
                  Share this link with others to invite them to your group. The
                  link will expire in 7 days.
                </p>
                <div className="flex items-center gap-2">
                  <Input value={inviteLink} readOnly className="flex-1" />
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
      </CardBody>
    </Card>
  );
};

export default GroupManagement;
