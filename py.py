import os
import re

# Map waarin gezocht moet worden ('.' voor huidige map)
TARGET_DIR = "."

# Bestandsextensies die verwerkt moeten worden
EXTENSIONS = (".ts", ".tsx", ".js", ".jsx")

# Mappen die overgeslagen moeten worden
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", ".next"}

# Vervanglijst: 'oudeNaam': 'Nieuwe_Naam'
REPLACEMENTS = {
    # Types & Interfaces
    "Supported_Lang": "Supported_Language",
    "PerMove": "Per_Move",
    "VariationData": "Variation_Data",
    "UsePlayLogicProps": "Use_Play_Logic_Properties",

    # Methodes & Functies
    "playMoveSound": "Play_Move_Sound",
    "recordMainlineMove": "Record_Mainline_Move",
    "tryPlayPremove": "Try_Play_Premove",
    "runEngine": "Run_Engine",
    "resetToSetup": "Reset_To_Setup",
    "undoMove": "Undo_Move",
    "tryVariationMove": "Try_Variation_Move",
    "computeVariationView": "Compute_Variation_View",

    # Variabelen & Eigenschappen
    "audioCtx": "Audio_Context",
    "playerColor": "Player_Color",
    "projectedBoard": "Projected_Board",
    "fenBefore": "FEN_Before",
    "sfOpts": "SF_Options",
    "randomChance": "Random_Chance",

    # --- Nieuw: uit ChessClock-bestand ---
    # Functies / componenten (duidelijk projectspecifiek, veilig)
    "formatClock": "Format_Clock",
    "ChessClock": "Chess_Clock",

    # NIET meegenomen (te generiek / risico op false positives elders):
    # "ms", "active", "low", "total", "m", "s", "tenths"
    # -> zeg het als je deze alsnog wilt toevoegen

    # --- Nieuw: uit Word/Dictionary/Language/Auth componenten ---
    # Types
    "FlipState": "Flip_State",

    # Componenten (default exports / named functies)
    "WordDetailView": "Word_Detail_View",
    "DictionarySubcategory": "Dictionary_Subcategory",
    "DictionaryWord": "Dictionary_Word",
    "DictionaryCategory": "Dictionary_Category",
    "DictionaryRoot": "Dictionary_Root",
    "LanguageIndex": "Language_Index",
    "LanguageRoot": "Language_Root",
    "AuthPage": "Auth_Page",
    "AuthInput": "Auth_Input",
    "LessonPage": "Lesson_Page",
    "NotFound": "Not_Found",
    "RootPicker": "Root_Picker",

    # Handlers / lokale functies
    "handleFlip": "Handle_Flip",
    "dataFor": "Data_For",
    "handleSubcategoryClick": "Handle_Subcategory_Click",
    "wordCooling": "Word_Cooling",
    "handleSignIn": "Handle_Sign_In",
    "handleSignUp": "Handle_Sign_Up",

    # Variabelen & State
    "activeLangName": "Active_Lang_Name",
    "setFlip": "Set_Flip",
    "editOpen": "Edit_Open",
    "setEditOpen": "Set_Edit_Open",
    "targetTextEarly": "Target_Text_Early",
    "showImage": "Show_Image",
    "interfaceWordLang": "Interface_Word_Lang",
    "showLang": "Show_Language",
    "isFront": "Is_Front",
    "frontPron": "Front_Pron",
    "rawWord": "Raw_Word",
    "subcategoryData": "Subcategory_Data",
    "customCategories": "Custom_Categories",
    "customCategory": "Custom_Category",
    "subcategoriesData": "Subcategories_Data",
    "setSubcategoriesData": "Set_Subcategories_Data",
    "subcategoryKeys": "Subcategory_Keys",
    "filteredSubcategories": "Filtered_Subcategories",
    "nameMatches": "Name_Matches",
    "wordSlugs": "Word_Slugs",
    "wordMatches": "Word_Matches",
    "matchingCount": "Matching_Count",
    "resolvedWords": "Resolved_Words",
    "setResolvedWords": "Set_Resolved_Words",
    "allWords": "All_Words",
    "isSel": "Is_Sel",
    "inputCls": "Input_Cls",
    "siEmail": "Si_Email",
    "setSiEmail": "Set_Si_Email",
    "siPassword": "Si_Password",
    "setSiPassword": "Set_Si_Password",
    "siError": "Si_Error",
    "setSiError": "Set_Si_Error",
    "suEmail": "Su_Email",
    "setSuEmail": "Set_Su_Email",
    "suPassword": "Su_Password",
    "setSuPassword": "Set_Su_Password",
    "suConfirm": "Su_Confirm",
    "setSuConfirm": "Set_Su_Confirm",
    "suAgree": "Su_Agree",
    "setSuAgree": "Set_Su_Agree",
    "suError": "Su_Error",
    "setSuError": "Set_Su_Error",

    # NIET meegenomen (single-word / te generiek / API-veldnamen):
    # "word", "flip", "data", "en", "nl", "cLang", "compiled", "cancelled",
    # "categories", "setCategories", "context", "cooling", "filtered", "toggle",
    # "tab", "login", "signup", "collections"
    # API-response keys (NIET hernoemen, breekt de backend-koppeling):
    # "vocabularyGrammar", "plural", "diminutive", "conjugation", "example", "gender"
}

def refactor_files():
    modified_count = 0

    # Sorteer sleutels op lengte (langste eerst) om gedeeltelijke matching te voorkomen
    sorted_keys = sorted(REPLACEMENTS.keys(), key=len, reverse=True)

    # Gebruik regex met word boundaries (\b) zodat bijvoorbeeld 'move' niet gematcht wordt in 'remove'
    pattern = re.compile(r'\b(' + '|'.join(re.escape(k) for k in sorted_keys) + r')\b')

    def replace_match(match):
        return REPLACEMENTS[match.group(0)]

    for root, dirs, files in os.walk(TARGET_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for file in files:
            if file.endswith(EXTENSIONS):
                file_path = os.path.join(root, file)

                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                new_content = pattern.sub(replace_match, content)

                if new_content != content:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Bijgewerkt: {file_path}")
                    modified_count += 1

    print(f"\nKlaar! {modified_count} bestand(en) succesvol hernoemd.")

if __name__ == "__main__":
    refactor_files()