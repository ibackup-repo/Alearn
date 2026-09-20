import { 
  User, 
  Globe, 
  LogOut, 
  Trash2, 
  BookMarked, 
  Palette, 
  Accessibility, 
  Crown, 
  MousePointerClick 
} from "lucide-react";
import type { Settings_Category_Config, Settings_Subcategory_Config } from "./Types";

export const SETTINGS_CATEGORIES: Settings_Category_Config[] = [
  { id: "profile",       Label_Key: "account",            fallback: "Account",            icon: User,           hasSubcategories: true },
  { id: "language",      Label_Key: "Interface_Language",  fallback: "Interface Language", icon: Globe,          hasSubcategories: false },
  { id: "chess",         Label_Key: "chess",              fallback: "Chess",              icon: Crown,          hasSubcategories: false },
  { id: "appearance",    Label_Key: "Appearance",         fallback: "Appearance",         icon: Palette,        hasSubcategories: true },
  { id: "accessibility", Label_Key: "accessibility",      fallback: "Accessibility",      icon: Accessibility,  hasSubcategories: false },
];

export const APPEARANCE_SUBCATEGORIES: Settings_Subcategory_Config[] = [
  { id: "general", Label_Key: "general", fallback: "General", icon: Palette },
  { id: "button",  Label_Key: "button",  fallback: "Button",     icon: MousePointerClick },
];

export const PROFILE_SUBCATEGORIES: Settings_Subcategory_Config[] = [
  { id: "account",    Label_Key: "profile",       fallback: "Profile",        icon: User },
  { id: "dictionary", Label_Key: "dictionary",    fallback: "Dictionary",     icon: BookMarked },
  { id: "signout",    Label_Key: "signOut",       fallback: "Sign out",       icon: LogOut },
  { id: "delete",     Label_Key: "deleteAccount", fallback: "Delete account", icon: Trash2 },
];

export function Get_Subcategories(Cat_ID: string): Settings_Subcategory_Config[] {
  if (Cat_ID === "profile") return PROFILE_SUBCATEGORIES;
  if (Cat_ID === "appearance") return APPEARANCE_SUBCATEGORIES;
  return [];
}