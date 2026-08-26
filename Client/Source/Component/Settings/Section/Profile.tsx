import { useNavigate } from "react-router-dom";
import { Use_App } from "@/Context/App";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/Button";
import { TitleBar } from "@/Component/UI/title-bar";
import { LogOut, LogIn, Trash2 } from "lucide-react";

interface Properties {
  Active_Subcategory: string;
}

export function ProfileSection({ Active_Subcategory }: Properties) {
  const { user, logout, Is_Authenticated } = Use_App();
  const { t } = Use_Course_Language();
  const navigate = useNavigate();

  const Handle_Sign_Out = () => {
    logout();
    navigate("/");
  };

  const Handle_Delete = () => {
    if (confirm(t("deleteAccountConfirm"))) {
      logout();
      try { localStorage.clear(); } catch { /* no-op */ }
      navigate("/");
    }
  };

  if (!Is_Authenticated) {
    return (
      <div className="space-y-4">
        <Container>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted text-foreground flex items-center justify-center font-semibold">
              ?
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{t("notLoggedIn") || "Not Logged In"}</p>
              <p className="text-sm opacity-70 truncate">
                {t("signInToSync") || "Sign in to save your progress."}
              </p>
            </div>
          </div>
        </Container>
        <Button fullWidth active onClick={() => navigate("/Sign")}>
          <LogIn className="h-4 w-4 mr-2" /> {t("signIn") || "Sign In"}
        </Button>
      </div>
    );
  }

  if (Active_Subcategory === "signout") {
    return (
      <Button variant="destructive" fullWidth onClick={Handle_Sign_Out}>
        <LogOut className="h-4 w-4 mr-2" /> {t("signOut")}
      </Button>
    );
  }

  if (Active_Subcategory === "delete") {
    return (
      <div className="space-y-3">
        <p className="text-sm">{t("deleteAccountConfirm")}</p>
        <Button variant="destructive" fullWidth onClick={Handle_Delete}>
          <Trash2 className="h-4 w-4 mr-2" /> {t("deleteAccount")}
        </Button>
      </div>
    );
  }

  const initials = (user?.firstName || "?").slice(0, 2).toUpperCase();
  return (
    <div className="space-y-4">
      <Container>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user?.firstName}</p>
            <p className="text-sm opacity-70 truncate">{user?.email}</p>
          </div>
        </div>
      </Container>
      <TitleBar>{t("profile")}</TitleBar>
    </div>
  );
}
