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
import { useTranslations } from "next-intl";

// ── Profile Tab ──
function ProfileTab() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const updateProfile = useUpdateProfile();
  const t = useTranslations("settings");
  const tc = useTranslations("common");

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
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            value={user?.email ?? ""}
            disabled
            className="opacity-60"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="w-full sm:w-auto"
        >
          {updateProfile.isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {t("saveChanges")}
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

  const confirmed = confirmText === "DELETE";

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

              <Input
                placeholder={t("deleteConfirmPlaceholder")}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                className="font-mono"
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>
                  {tc("cancel")}
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
          <TabsTrigger value="data">{t("data")}</TabsTrigger>
          <TabsTrigger value="danger">{t("danger")}</TabsTrigger>
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
