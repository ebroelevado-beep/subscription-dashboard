"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  User,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Loader2,
  Settings,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  useUpdateProfile,
  useExportData,
  useImportData,
  useDeleteAccount,
} from "@/hooks/use-account";

// ── Profile Tab ──
function ProfileTab() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(user?.name ?? "");
  const [image, setImage] = useState(user?.image ?? "");

  const handleSave = () => {
    updateProfile.mutate(
      {
        name: name || undefined,
        image: image || null,
      },
      {
        onSuccess: () => {
          toast.success("Profile updated");
          updateSession({ name, image });
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="size-5" />
          Profile
        </CardTitle>
        <CardDescription>
          Update your display name and avatar URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Avatar URL</Label>
          <Input
            id="image"
            placeholder="https://example.com/avatar.jpg"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            type="url"
          />
          <p className="text-xs text-muted-foreground">
            Paste a direct URL to an image. Leave empty to remove.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="w-full sm:w-auto"
        >
          {updateProfile.isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Data Tab ──
function DataTab() {
  const exportData = useExportData();
  const importData = useImportData();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    toast.promise(exportData.mutateAsync(), {
      loading: "Preparing export…",
      success: "Data exported successfully!",
      error: (err) => err.message,
    });
  };

  const handleImport = () => {
    fileRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        toast.promise(importData.mutateAsync(json), {
          loading: "Importing data…",
          success: "Data imported successfully! Refresh to see changes.",
          error: (err) => err.message,
        });
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be picked again
    e.target.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="size-5" />
          Data Portability
        </CardTitle>
        <CardDescription>
          Export all your data as JSON or import a previous backup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div>
            <h4 className="text-sm font-medium">Export My Data</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Downloads a JSON file with all your platforms, plans,
              subscriptions, clients, and renewal history.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportData.isPending}
          >
            {exportData.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export JSON
          </Button>
        </div>

        {/* Import */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div>
            <h4 className="text-sm font-medium">Import Data from JSON</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Import a SubLedger backup file. Data is added alongside your
              existing records — nothing is overwritten.
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={onFileSelected}
          />
          <Button
            variant="outline"
            onClick={handleImport}
            disabled={importData.isPending}
          >
            {importData.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Import JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Danger Zone ──
function DangerZone() {
  const deleteAccount = useDeleteAccount();
  const [confirmText, setConfirmText] = useState("");
  const [open, setOpen] = useState(false);

  const confirmed = confirmText === "DELETE";

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible actions. Proceed with extreme caution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div>
            <h4 className="text-sm font-medium text-destructive">
              Delete My Account
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Permanently deletes your account and all associated data
              (platforms, plans, subscriptions, clients, and all renewal
              history). This action cannot be undone.
            </p>
          </div>

          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="size-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all your
                  data. We recommend exporting your data first.
                  <br />
                  <br />
                  Type <strong>DELETE</strong> below to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <Input
                placeholder='Type "DELETE" to confirm'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                className="font-mono"
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={!confirmed || deleteAccount.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    deleteAccount.mutate(undefined, {
                      onError: (err) => {
                        toast.error(err.message);
                        setOpen(false);
                      },
                    });
                  }}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {deleteAccount.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="size-6" />
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, export your data, or delete your account.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="data">
          <DataTab />
        </TabsContent>

        <TabsContent value="danger">
          <DangerZone />
        </TabsContent>
      </Tabs>
    </div>
  );
}
