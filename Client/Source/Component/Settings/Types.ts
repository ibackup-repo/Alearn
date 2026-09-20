import { LucideIcon } from "lucide-react";

export type Settings_Category_ID = "profile" | "language" | "appearance" | "accessibility" | "chess";
export type Profile_Sub_ID = "account" | "signout";
export type Sub_ID = Profile_Sub_ID | string;

export interface Settings_Category_Config {
  id: Settings_Category_ID;
  Label_Key: string;
  fallback: string;
  icon: LucideIcon;
  hasSubcategories: boolean;
}

export interface Settings_Subcategory_Config {
  id: string;
  Label_Key: string;
  fallback: string;
  icon: LucideIcon;
}