export type VaultEntry = {
    id: string;
    site: string;
    username: string;
};
  
export type LicenseEntry = {
    product_name: string;
    id: string;
    description: string;
};

export type NoteEntry = {
    id: string;
    title: string;
};

export type ApiEntry = {
    service_name: string;
    id: string;
    description: string;
};

export type VaultDisplayProps = {
    userToken: string;
    entries: (VaultEntry | LicenseEntry|NoteEntry|ApiEntry)[];
    setEntries: React.Dispatch<React.SetStateAction<(VaultEntry | LicenseEntry|NoteEntry|ApiEntry)[]>>;
    onEntriesLoaded?: (loadedEntries: (VaultEntry | LicenseEntry | NoteEntry | ApiEntry)[]) => void;
};