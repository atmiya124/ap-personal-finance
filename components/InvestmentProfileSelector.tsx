"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createInvestmentProfile, deleteInvestmentProfile, setDefaultInvestmentProfile } from "@/app/actions";
import { Loader2 } from "lucide-react";

interface InvestmentProfile {
  id: string;
  name: string;
  isDefault: boolean;
}

interface InvestmentProfileSelectorProps {
  profiles: InvestmentProfile[];
  currentProfileId?: string | null;
}

export function InvestmentProfileSelector({
  profiles,
  currentProfileId,
}: InvestmentProfileSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProfileChange = (profileId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("profile", profileId);
    router.push(`/investments?${params.toString()}`);
  };
  
  const handleCreateProfileAndSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) {
      toast({
        title: "Error",
        description: "Profile name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newProfile = await createInvestmentProfile(newProfileName.trim());
      toast({
        title: "Success",
        description: "Profile created successfully",
      });
      setNewProfileName("");
      setIsDialogOpen(false);
      
      // Select the newly created profile
      if (newProfile && newProfile.id) {
        router.push(`/investments?profile=${newProfile.id}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this profile? Investments in this profile will be deleted.")) {
      return;
    }

    try {
      await deleteInvestmentProfile(profileId);
      toast({
        title: "Success",
        description: "Profile deleted successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (profileId: string) => {
    try {
      await setDefaultInvestmentProfile(profileId);
      toast({
        title: "Success",
        description: "Default profile updated",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default profile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="profile-select" className="text-sm font-medium">
        Profile:
      </Label>
      <Select
        value={currentProfileId || ""}
        onValueChange={handleProfileChange}
      >
        <SelectTrigger id="profile-select" className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {profiles.length === 0 ? (
            <SelectItem value="" disabled>No profiles - Create one first</SelectItem>
          ) : (
            profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                <div className="flex items-center gap-2">
                  {profile.isDefault && (
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  )}
                  {profile.name}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Profile
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Investment Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProfileAndSelect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Profile Name</Label>
              <Input
                id="profile-name"
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="e.g., Personal, Retirement, Joint"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {profiles.length > 0 && (
        <div className="flex items-center gap-2 ml-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm group"
            >
              <span>{profile.name}</span>
              {profile.isDefault && (
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              )}
              <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {!profile.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleSetDefault(profile.id)}
                    title="Set as default"
                  >
                    <Star className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteProfile(profile.id)}
                  title="Delete profile"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

