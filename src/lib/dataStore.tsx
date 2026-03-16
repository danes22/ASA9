import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "./supabase";

// ============================================================
// Types
// ============================================================
export interface NewsItem {
  id: string;
  judul: string;
  isi: string;
  tag: string;
  foto?: string;
  link?: string;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  judul: string;
  deskripsi?: string;
  foto?: string;
  link?: string;
  aspect: string;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  nama?: string;
  pesan: string;
  is_read: boolean;
  created_at: string;
}

// ============================================================
// Context
// ============================================================
interface DataStore {
  news: NewsItem[];
  gallery: GalleryItem[];
  feedbacks: FeedbackItem[];
  loadingNews: boolean;
  loadingGallery: boolean;
  loadingFeedbacks: boolean;
  refreshNews: () => Promise<void>;
  refreshGallery: () => Promise<void>;
  refreshFeedbacks: () => Promise<void>;
  addFeedback: (nama: string, pesan: string) => Promise<{ error: string | null }>;
}

const DataContext = createContext<DataStore | null>(null);

export const useDataStore = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDataStore must be inside DataProvider");
  return ctx;
};

// ============================================================
// Provider
// ============================================================
export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  const refreshNews = useCallback(async () => {
    setLoadingNews(true);
    const { data } = await supabase
      .from("berita")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setNews(data);
    setLoadingNews(false);
  }, []);

  const refreshGallery = useCallback(async () => {
    setLoadingGallery(true);
    const { data } = await supabase
      .from("galeri")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setGallery(data);
    setLoadingGallery(false);
  }, []);

  const refreshFeedbacks = useCallback(async () => {
    setLoadingFeedbacks(true);
    const { data } = await supabase
      .from("kritik_saran")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setFeedbacks(data);
    setLoadingFeedbacks(false);
  }, []);

  const addFeedback = useCallback(async (nama: string, pesan: string) => {
    const { error } = await supabase.from("kritik_saran").insert({
      nama: nama.trim() || "Anonim",
      pesan: pesan.trim(),
    });
    return { error: error?.message || null };
  }, []);

  useEffect(() => {
    refreshNews();
    refreshGallery();
  }, []);

  return (
    <DataContext.Provider value={{
      news, gallery, feedbacks,
      loadingNews, loadingGallery, loadingFeedbacks,
      refreshNews, refreshGallery, refreshFeedbacks,
      addFeedback,
    }}>
      {children}
    </DataContext.Provider>
  );
};