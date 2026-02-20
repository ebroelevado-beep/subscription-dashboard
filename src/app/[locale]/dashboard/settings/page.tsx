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
  Palette,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updatePasswordAction } from "@/actions/password";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useTranslations } from "next-intl";

// ── Profile Tab ──
function ProfileTab() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const updateProfile = useUpdateProfile();
  const t = useTranslations("settings");

  const [name, setName] = useState(user?.name ?? "");
  const [image, setImage] = useState(user?.image ?? "");
  const hasPassword = user?.hasPassword;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error(t("passwordTooShort", { fallback: "Password must be at least 6 characters" }));
      return;
    }

    if (hasPassword && !currentPassword) {
      toast.error(t("currentPasswordRequired", { fallback: "Current password is required" }));
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      const formData = new FormData();
      if (hasPassword) formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);

      // Using dynamic import of Server Action to avoid module issues if needed,
      // but assuming it's imported at the top. Let's assume fetch/api or action.
      // Wait, we need to import updatePasswordAction, I will add it top of file.
      
      const result = await updatePasswordAction(null, formData);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update password");
      }
      
      toast.success(
        hasPassword
          ? t("passwordUpdated", { fallback: "Password updated successfully!" })
          : t("passwordSetSuccess", { fallback: "Password set! You can now log in with email." })
      );
      
      setCurrentPassword("");
      setNewPassword("");
      
      // Update session to reflect hasPassword
      if (!hasPassword) {
        updateSession({ user: { ...user, hasPassword: true } });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSave = () => {
    updateProfile.mutate(
      {
        name: name || undefined,
        image: image || null,
      },
      {
        onSuccess: () => {
          toast.success(t("profileUpdated"));
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
          {t("profile")}
        </CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b">
          <Avatar className="size-24 border-2 border-muted">
            <AvatarImage src={image || ""} alt={name} />
            <AvatarFallback className="text-2xl">
              {name.slice(0, 2).toUpperCase() || <User className="size-10" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <h3 className="text-lg font-medium">{t("profileImage")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("profileImageDescription")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("displayName")}</Label>
            <Input
              id="name"
              placeholder={t("displayName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">{t("profileImage")}</Label>
            <Input
              id="image"
              placeholder="https://example.com/avatar.jpg"
              value={image || ""}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            value={user?.email ?? ""}
            disabled
            className="bg-muted/50 cursor-not-allowed"
          />
          <p className="text-[0.8rem] text-muted-foreground">
            {t("emailDescription")}
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div>
            <h3 className="text-lg font-medium">
              {hasPassword ? t("changePassword", { fallback: "Change Password" }) : t("setupPassword", { fallback: "Set up Password" })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {hasPassword
                ? t("changePasswordDescription", { fallback: "Update your current password." })
                : t("setupPasswordDescription", { fallback: "Set a password to log in without Google." })}
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("currentPassword", { fallback: "Current Password" })}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPassword", { fallback: "New Password" })}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handlePasswordSubmit}
            disabled={isUpdatingPassword || !newPassword || (hasPassword && !currentPassword)}
          >
            {isUpdatingPassword ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {hasPassword ? t("updatePassword", { fallback: "Update Password" }) : t("setPassword", { fallback: "Set Password" })}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 px-6 py-4 border-t flex justify-end">
        <Button onClick={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending && (
            <Loader2 className="mr-2 size-4 animate-spin" />
          )}
          {t("saveChanges")}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Appearance Tab ──
function AppearanceTab() {
  const t = useTranslations("settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-5" />
          {t("appearance")}
        </CardTitle>
        <CardDescription>
          {t("appearanceDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-medium">{t("appearance")}</h4>
            <p className="text-xs text-muted-foreground">
              {t("appearanceDescription")}
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-medium">{t("language")}</h4>
            <p className="text-xs text-muted-foreground">
              {t("language")}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Data Tab ──
function DataTab() {
  const exportData = useExportData();
  const importData = useImportData();
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("settings");

  const handleExport = () => {
    toast.promise(exportData.mutateAsync(), {
      loading: t("exporting"),
      success: t("exportSuccess"),
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
          loading: t("importing"),
          success: t("importSuccess"),
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
          {t("data")}
        </CardTitle>
        <CardDescription>
          {t("exportDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div>
            <h4 className="text-sm font-medium">{t("exportData")}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t("exportDescription")}
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
            {t("exportData")}
          </Button>
        </div>

        {/* Import */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div>
            <h4 className="text-sm font-medium">{t("importData")}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t("importDescription")}
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
            {t("importData")}
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
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          {t("danger")}
        </CardTitle>
        <CardDescription>
          {t("deleteWarning")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div>
            <h4 className="text-sm font-medium text-destructive">
              {t("deleteAccount")}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t("deleteWarning")}
            </p>
          </div>

          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="size-4" />
                {t("deleteAccount")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("confirmDelete")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t.rich("typeDeleteToConfirm", {
                confirmWord: t("deleteConfirmPlaceholder"),
                word: (word) => (
                  <span className="font-bold text-destructive underline decoration-2 underline-offset-2">
                    {word}
                  </span>
                ),
              })}
            </p>
            <Input
              placeholder={t("deleteConfirmPlaceholder")}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== t("deleteConfirmPlaceholder") || deleteAccount.isPending}
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
                  {tc("delete")}
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
  const t = useTranslations("settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="size-6" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
          <TabsTrigger value="appearance">{t("appearance")}</TabsTrigger>
          <TabsTrigger value="data">{t("data")}</TabsTrigger>
          <TabsTrigger value="danger">{t("danger")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceTab />
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
