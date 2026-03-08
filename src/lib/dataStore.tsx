import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { createSecureStorage } from "./security";

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  imageUrl?: string;
  link?: string;
}


export interface FeedbackItem {
  id: string;
  name?: string;
  feedback: string;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  aspect: string;
  imageUrl?: string;
  link?: string;
}

const defaultNews: NewsItem[] = [
  { id: "1", title: "ASA 9 Raih Juara di Lomba Jurnalistik Nasional", excerpt: "Tim jurnalistik ASA 9 berhasil meraih prestasi gemilang dalam kompetisi tingkat nasional...", date: "12 Feb 2026", tag: "Prestasi" },
  { id: "2", title: "Workshop Fotografi Bersama Fotografer Profesional", excerpt: "Kegiatan workshop fotografi bersama mentor berpengalaman telah sukses dilaksanakan...", date: "8 Feb 2026", tag: "Kegiatan" },
  { id: "3", title: "Majalah Sekolah Edisi Terbaru Telah Terbit", excerpt: "Edisi terbaru majalah sekolah karya ASA 9 kini sudah dapat dibaca oleh seluruh siswa...", date: "1 Feb 2026", tag: "Publikasi" },
];

const defaultGallery: GalleryItem[] = [
  { id: "1", title: "Workshop Fotografi", description: "Pelatihan teknik fotografi dasar dan lanjutan", aspect: "aspect-square" },
  { id: "2", title: "Peliputan Acara", description: "Dokumentasi kegiatan sekolah", aspect: "aspect-[4/5]" },
  { id: "3", title: "Tim Redaksi", description: "Rapat redaksi majalah sekolah", aspect: "aspect-square" },
  { id: "4", title: "Studio Broadcasting", description: "Kegiatan siaran radio sekolah", aspect: "aspect-[4/5]" },
  { id: "5", title: "Kompetisi Nasional", description: "Partisipasi di ajang nasional", aspect: "aspect-square" },
  { id: "6", title: "Behind The Scene", description: "Proses di balik layar produksi", aspect: "aspect-[4/5]" },
];

const secureStorage = createSecureStorage();

interface DataStore {
  news: NewsItem[];
  setNews: (news: NewsItem[]) => void;
  feedbacks: FeedbackItem[];
  addFeedback: (fb: Omit<FeedbackItem, "id" | "createdAt">) => void;
  gallery: GalleryItem[];
  setGallery: (gallery: GalleryItem[]) => void;
}

const DataContext = createContext<DataStore | null>(null);

export const useDataStore = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDataStore must be inside DataProvider");
  return ctx;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [news, setNewsState] = useState<NewsItem[]>(defaultNews);
  
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [gallery, setGalleryState] = useState<GalleryItem[]>(defaultGallery);
  const initialized = useRef(false);

  // Load from secure storage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const loadAll = async () => {
      const [loadedNews, loadedFeedbacks, loadedGallery] = await Promise.all([
        secureStorage.load<NewsItem[]>("news", defaultNews),
        secureStorage.load<FeedbackItem[]>("feedbacks", []),
        secureStorage.load<GalleryItem[]>("gallery", defaultGallery),
      ]);
      setNewsState(loadedNews);
      
      setFeedbacks(loadedFeedbacks);
      setGalleryState(loadedGallery);
    };

    loadAll();
  }, []);

  const setNews = useCallback((n: NewsItem[]) => {
    setNewsState(n);
    secureStorage.save("news", n);
  }, []);

  const setGallery = useCallback((g: GalleryItem[]) => {
    setGalleryState(g);
    secureStorage.save("gallery", g);
  }, []);


  const addFeedback = useCallback((fb: Omit<FeedbackItem, "id" | "createdAt">) => {
    setFeedbacks(prev => {
      const next = [{ ...fb, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...prev];
      secureStorage.save("feedbacks", next);
      return next;
    });
  }, []);

  return (
    <DataContext.Provider value={{ news, setNews, feedbacks, addFeedback, gallery, setGallery }}>
      {children}
    </DataContext.Provider>
  );
};

