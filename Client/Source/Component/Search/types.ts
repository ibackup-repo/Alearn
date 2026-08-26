export type Search_Category = "all" | "categories" | "subcategories" | "words";

export interface Search_Result {
  id: string;
  title: string;
  subtitle?: string;
  secondary?: string; // e.g. translation in other lang
  path: string;
  type: "Category" | "Subcategory" | "Word";
}

export interface Search_Category_Config {
  id: Search_Category;
  label: string;
  placeholder: string;
}
