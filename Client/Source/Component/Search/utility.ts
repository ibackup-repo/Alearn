import type { Search_Category, Search_Result, Search_Category_Config } from "./Types";

export const Categories: Search_Category_Config[] = [
  { id: "all", label: "All", placeholder: "Search categories, subcategories, words…" },
  { id: "categories", label: "Categories", placeholder: "Search categories…" },
  { id: "subcategories", label: "Subcategories", placeholder: "Search subcategories…" },
  { id: "words", label: "Words", placeholder: "Search words…" },
];

export const Category_Map = Object.fromEntries(Categories.map(c => [c.id, c])) as Record<Search_Category, Search_Category_Config>;

export function Get_Result_Type_Label(Category: Search_Category): string {
  switch (Category) {
    case "categories": return "Categories";
    case "subcategories": return "Subcategories";
    case "words": return "Words";
    default: return "Results";
  }
}

interface Search_Opts {
  UI_Language: string;          // Selected UI language code (e.g. "nl", "ar", "en")
  Course_Language: string;      // The current learning language track variable (e.g. "nl", "en")
  Concept_Slug: string;     // First segment path route token prefix (e.g., "language")
  Cached_Categories: any[];    // Dynamically provided collection from getCategories() API
  Cached_Subcategories: any[]; // Dynamically provided collection from Get_Subcategories() API
}

export function Search_By_Category(query: string, Category: Search_Category, opts: Search_Opts): Search_Result[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  
  const { UI_Language, Course_Language, Concept_Slug, Cached_Categories, Cached_Subcategories } = opts;
  const Other_Lang = Course_Language === "en" ? "nl" : "en";

  const Cat_Results: Search_Result[] = [];
  const Sub_Results: Search_Result[] = [];
  const Word_Results: Search_Result[] = [];

  // 1. Process Cached Categories
  for (const cat of Cached_Categories) {
    const Cat_Name = cat.name?.[UI_Language] || cat.name?.en || cat.id;
    const Cat_En = (cat.name?.en || "").toLowerCase();
    
    // Check if subcategories are nested or belong via reference filter
    const Related_Subs = Cached_Subcategories.filter(s => s.Cat_ID === cat.id || s.Category_ID === cat.id);

    if (Cat_Name.toLowerCase().includes(q) || Cat_En.includes(q)) {
      Cat_Results.push({
        id: `cat-${cat.id}`,
        title: Cat_Name,
        subtitle: `${Related_Subs.length} subcategories`,
        path: `/${Concept_Slug}/${cat.id}`,
        type: "Category",
      });
    }
  }

  // 2. Process Cached Subcategories and Inner Words Flat Matrix Strings
  for (const sub of Cached_Subcategories) {
    const Parent_Cat_Id = sub.Cat_ID || sub.Category_ID;
    const Parent_Cat = Cached_Categories.find(c => c.id === Parent_Cat_Id);
    const Cat_Name = Parent_Cat?.name?.[UI_Language] || Parent_Cat?.name?.en || Parent_Cat_Id || "";

    const Sub_Name = sub.name?.[UI_Language] || sub.name?.en || sub.id;
    const Sub_En = (sub.name?.en || "").toLowerCase();
    const Words_List = sub.words || [];

    if (Sub_Name.toLowerCase().includes(q) || Sub_En.includes(q)) {
      Sub_Results.push({
        id: `sub-${Parent_Cat_Id}-${sub.id}`,
        title: Sub_Name,
        subtitle: `${Cat_Name} • ${Words_List.length} words`,
        path: `/${Concept_Slug}/${Parent_Cat_Id}/${sub.id}`,
        type: "Subcategory",
      });
    }

    // 3. Drill-down into inner language tokens inside subcategory payloads
    for (const word of Words_List) {
      // Safely resolve learning words based on target track criteria
      const W_Target = word.text || (Course_Language === "ar" ? word.ar?.word : word[Course_Language]?.word) || word.en?.word || word.id;
      const W_Other = word[Other_Lang]?.word || word.word || "";
      
      if (
        W_Target.toLowerCase().includes(q) ||
        W_Other.toLowerCase().includes(q)
      ) {
        Word_Results.push({
          id: `word-${word.id}`,
          title: W_Target,
          secondary: W_Other !== W_Target ? W_Other : undefined,
          subtitle: `${Cat_Name} › ${Sub_Name}`,
          path: `/${Concept_Slug}/${Parent_Cat_Id}/${sub.id}/${word.id}`,
          type: "Word",
        });
      }
    }
  }

  let combined: Search_Result[] = [];
  switch (Category) {
    case "categories": combined = Cat_Results; break;
    case "subcategories": combined = Sub_Results; break;
    case "words": combined = Word_Results; break;
    default: combined = [...Cat_Results, ...Sub_Results, ...Word_Results];
  }
  
  return combined.slice(0, 12);
}