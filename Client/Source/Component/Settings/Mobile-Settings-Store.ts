// @/Component/Settings/Mobile-Settings-Store.ts
type Listener = () => void;

let title = "Settings";
let Show_Back = false;
let Go_Back_Function: (() => void) | null = null;
let Close_Function: (() => void) | null = null;
let Is_Search_Mode = false;
let On_Exit_Search: (() => void) | null = null;
let Search_Query = "";
let Ignore_Sync = false;

// Stack for nested modals (e.g., font picker)
type Modal_State = {
  title: string;
  Show_Back: boolean;
  goBack: () => void;
  close: () => void;
};
let Modal_Stack: Modal_State[] = [];

const listeners = new Set<Listener>();
const Search_Listeners = new Set<Listener>();

export const Mobile_Settings_Store = {
  getState() {
    return { title, Show_Back, Is_Search_Mode, Ignore_Sync };
  },
  setState(
    newTitle: string,
    newShowBack: boolean,
    newGoBack: () => void,
    newClose: () => void,
    newIgnoreSync?: boolean
  ) {
    title = newTitle;
    Show_Back = newShowBack;
    Go_Back_Function = newGoBack;
    Close_Function = newClose;
    if (newIgnoreSync !== undefined) Ignore_Sync = newIgnoreSync;
    listeners.forEach(listener => listener());
  },
  // Push a modal onto the stack (e.g., font picker)
  Push_Modal(title: string, Show_Back: boolean, onBack: () => void, onClose: () => void) {
    Modal_Stack.push({
      title: this.getState().title,
      Show_Back: this.getState().Show_Back,
      goBack: Go_Back_Function || (() => {}),
      close: Close_Function || (() => {}),
    });
    this.setState(title, Show_Back, onBack, onClose, true);
  },
  // Pop the modal and restore previous state
  Pop_Modal() {
    const prev = Modal_Stack.pop();
    if (prev) {
      this.setState(prev.title, prev.Show_Back, prev.goBack, prev.close, false);
    } else {
      this.setState("Settings", false, () => {}, () => {}, false);
    }
  },
  // Search mode
  Enter_Search_Mode(onExit: () => void) {
    Is_Search_Mode = true;
    On_Exit_Search = onExit;
    listeners.forEach(listener => listener());
  },
  Exit_Search_Mode() {
    Is_Search_Mode = false;
    On_Exit_Search?.();
    On_Exit_Search = null;
    Search_Query = "";
    Search_Listeners.forEach(l => l());
    listeners.forEach(listener => listener());
  },
  Set_Search_Query(query: string) {
    Search_Query = query;
    Search_Listeners.forEach(l => l());
  },
  Get_Search_Query() {
    return Search_Query;
  },
  // FIXED: Fallback safety if the view components haven't bound hooks yet
  goBack() {
    if (Go_Back_Function) {
      Go_Back_Function();
    } else {
      console.warn("[STORE WARNING] goBack executed without registered handler context.");
    }
  },
  close() {
    if (Close_Function) {
      Close_Function();
    } else {
      console.warn("[STORE WARNING] close executed without registered handler context.");
    }
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  subscribeSearch(listener: Listener) {
    Search_Listeners.add(listener);
    return () => Search_Listeners.delete(listener);
  }
};