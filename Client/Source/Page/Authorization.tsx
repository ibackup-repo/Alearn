import { useState } from "react";
import { Use_App } from "@/Context/App";
import { useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { Checkbox } from "@/Component/UI/checkbox";
import { cn } from "@/Library/Utility";

const Input_Cls = cn(
  "w-full h-11 rounded-[40px] bg-background border-2 border-border text-foreground",
  "px-5 placeholder:text-foreground/50",
  "focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0",
);

function Auth_Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(Input_Cls, props.className)} />;
}

export default function Auth_Page() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const { login, signup } = Use_App();
  const navigate = useNavigate();

  // Sign in
  const [Si_Email, Set_Si_Email] = useState("");
  const [Si_Password, Set_Si_Password] = useState("");
  const [Si_Error, Set_Si_Error] = useState("");

  // Sign up
  const [Su_Email, Set_Su_Email] = useState("");
  const [Su_Password, Set_Su_Password] = useState("");
  const [Su_Confirm, Set_Su_Confirm] = useState("");
  const [Su_Agree, Set_Su_Agree] = useState(false);
  const [Su_Error, Set_Su_Error] = useState("");

  const Handle_Sign_In = () => {
    Set_Si_Error("");
    const ok = login(Si_Email, Si_Password);
    if (ok) navigate("/");
    else Set_Si_Error("Invalid credentials. Use a@mail.com / A");
  };

  const Handle_Sign_Up = () => {
    Set_Su_Error("");
    if (!Su_Email) return Set_Su_Error("Email is required");
    if (!Su_Password) return Set_Su_Error("Password is required");
    if (Su_Password !== Su_Confirm) return Set_Su_Error("Passwords don't match");
    if (!Su_Agree) return Set_Su_Error("You must agree to the Terms & Services");
    signup("", Su_Email, Su_Password);
    navigate("/");
  };

  return (
    <div className="flex items-start justify-center px-4">
      <div className="w-full max-w-sm space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button fullWidth active={tab === "signin"} onClick={() => setTab("signin")}>Sign In</Button>
          <Button fullWidth active={tab === "signup"} onClick={() => setTab("signup")}>Sign Up</Button>
        </div>

        {tab === "signin" ? (
          <div className="space-y-3">
            <Auth_Input value={Si_Email} onChange={e => Set_Si_Email(e.target.value)} placeholder="Email" />
            <Auth_Input type="password" value={Si_Password} onChange={e => Set_Si_Password(e.target.value)} placeholder="Password" />
            {Si_Error && <p className="text-sm text-destructive">{Si_Error}</p>}
            <Button onClick={Handle_Sign_In} fullWidth>Continue</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Auth_Input value={Su_Email} onChange={e => Set_Su_Email(e.target.value)} placeholder="Email" />
            <Auth_Input type="password" value={Su_Password} onChange={e => Set_Su_Password(e.target.value)} placeholder="Password" />
            <Auth_Input type="password" value={Su_Confirm} onChange={e => Set_Su_Confirm(e.target.value)} placeholder="Confirm Password" />
            <div className="flex items-center gap-2 px-2">
              <Checkbox checked={Su_Agree} onCheckedChange={(v) => Set_Su_Agree(!!v)} id="terms" />
              <label htmlFor="terms" className="text-sm">I agree to the Terms & Services</label>
            </div>
            {Su_Error && <p className="text-sm text-destructive">{Su_Error}</p>}
            <Button onClick={Handle_Sign_Up} fullWidth>Continue</Button>
          </div>
        )}
      </div>
    </div>
  );
}
