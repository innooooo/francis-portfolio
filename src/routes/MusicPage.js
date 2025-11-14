import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Download,
  Eye,
  Calendar,
  Search,
  Filter,
  Heart,
  ExternalLink,
  X,
} from "lucide-react";
import "../MusicPage.css";

/**
 * CONFIG:
 * - Insert your YOUTUBE_API_KEY and optionally CHANNEL_ID or CHANNEL_HANDLE
 * - If CHANNEL_ID is empty, component will try to detect it via CHANNEL_HANDLE
 */
const CONFIG = {
  YOUTUBE_API_KEY: "AIzaSyB1Bg552PcG5Gu-2BJ0ilHMuedXQgbcc5E",
  CHANNEL_ID: "", // <-- Optionally paste the channel ID here (e.g., UCxxxx)
  CHANNEL_HANDLE: "@franciskogi", // <-- Example handle. Try to keep @ prefix.
  MAX_RESULTS_PER_PAGE: 50, // YouTube max for search is 50
};

// ---------- Utility functions ----------
/** Convert ISO 8601 duration (PT#H#M#S) to H:MM:SS or M:SS */
export function formatDuration(iso) {
  if (!iso) return "--:--";
  // Parse ISO duration
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

/** 1234567 -> 1.23M / 45K / 512 */
export function formatViews(count) {
  if (count === undefined || count === null) return "0";
  const n = Number(count);
  if (isNaN(n)) return count;
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

/** "2024-11-12T08:00:00Z" => "Nov 12, 2024" */
export function formatDate(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

/** Get download link(s). Default using Y2Mate; commented alternatives are provided. */
export function getDownloadLink(videoId) {
  return `https://y2mate.com/youtube/${videoId}`;
  // Alternatives (commented):
  // return `https://ytmp3.plus/en19/${videoId}`; // YTMP3 style (may vary)
  // return `https://en.savefrom.net/1-${videoId}`; // SaveFrom.net pattern (check site)
}

/** Format numbers with commas (used internally if needed) */
function numberWithCommas(x) {
  return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ---------- Main component ----------
export default function MusicCatalog() {
  // STATES
  const [channelId, setChannelId] = useState(CONFIG.CHANNEL_ID || "");
  const [channelInfo, setChannelInfo] = useState(null);
  const [videos, setVideos] = useState([]); // each item: { videoId, snippet, details }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest"); // latest, mostViewed, alpha
  const [selectedVideo, setSelectedVideo] = useState(null); // video object for modal
  const modalIframeRef = useRef(null);

  // Pagination and API state trackers
  const controllerRef = useRef(null); // for aborting fetches if needed

  // EFFECT: initialize data
  useEffect(() => {
  let isMounted = true;
  controllerRef.current = new AbortController();

  async function init() {
    setLoading(true);
    setError(null);
    setVideos([]);
    setChannelInfo(null);

    if (!CONFIG.YOUTUBE_API_KEY || CONFIG.YOUTUBE_API_KEY.includes("YOUR_")) {
      setError(
        "YouTube API key is missing. Insert your API key in the CONFIG at the top of the component."
      );
      setLoading(false);
      return;
    }

    try {
      let resolvedChannelId = channelId || "";

      if (!resolvedChannelId) {
        if (CONFIG.CHANNEL_HANDLE && CONFIG.CHANNEL_HANDLE.trim().length > 0) {
          console.log("[MusicCatalog] Detecting channel ID from handle:", CONFIG.CHANNEL_HANDLE);
          resolvedChannelId = await fetchChannelIdFromHandle(
            CONFIG.CHANNEL_HANDLE,
            CONFIG.YOUTUBE_API_KEY
          );
          if (!resolvedChannelId) {
            throw new Error(
              `Could not determine channel ID from handle "${CONFIG.CHANNEL_HANDLE}". Try providing CHANNEL_ID in CONFIG.`
            );
          }
          if (isMounted) setChannelId(resolvedChannelId);
        } else {
          throw new Error("No CHANNEL_ID or CHANNEL_HANDLE provided in CONFIG.");
        }
      }

      const chInfo = await fetchChannelInfo(resolvedChannelId, CONFIG.YOUTUBE_API_KEY);
      if (isMounted) setChannelInfo(chInfo);

      const allSearchResults = await fetchAllChannelVideos(
        resolvedChannelId,
        CONFIG.YOUTUBE_API_KEY
      );
      console.log("[MusicCatalog] total search results fetched:", allSearchResults.length);

      if (allSearchResults.length === 0) {
        setVideos([]);
        setLoading(false);
        return;
      }

      const videoIdList = allSearchResults.map((item) => item.id.videoId).filter(Boolean);
      const videoDetailsMap = await fetchVideosDetailsBatched(
        videoIdList,
        CONFIG.YOUTUBE_API_KEY
      );

      const merged = allSearchResults.map((item) => {
        const vid = item.id.videoId;
        return {
          videoId: vid,
          snippet: item.snippet,
          details: videoDetailsMap[vid] || {},
        };
      });

      if (isMounted) setVideos(merged);
    } catch (err) {
      console.error("[MusicCatalog] Error:", err);
      setError(
        err?.message ||
          "An unknown error occurred while fetching the music catalog. Check console for details."
      );
    } finally {
      if (isMounted) setLoading(false);
    }
  }

  init();

  return () => {
    isMounted = false;
    if (controllerRef.current) controllerRef.current.abort();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [channelId, CONFIG.CHANNEL_HANDLE, CONFIG.YOUTUBE_API_KEY]);


  // ---------- API helper functions ----------


  async function fetchChannelIdFromHandle(handle, apiKey) {
    try {
      const q = encodeURIComponent(handle.replace(/^@/, ""));
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${q}&maxResults=1&key=${apiKey}`;
      console.log("[MusicCatalog] fetchChannelIdFromHandle URL:", url);
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        console.warn("[MusicCatalog] fetchChannelIdFromHandle non-ok:", res.status, txt);
        return null;
      }
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].snippet.channelId;
      }
      return null;
    } catch (err) {
      console.error("[MusicCatalog] fetchChannelIdFromHandle error:", err);
      return null;
    }
  }

  /** Fetch channel snippet + statistics */
  async function fetchChannelInfo(id, apiKey) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${id}&key=${apiKey}`;
    console.log("[MusicCatalog] fetchChannelInfo URL:", url);
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to fetch channel info: ${res.status} ${txt}`);
    }
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      throw new Error("Channel not found or no public data available.");
    }
    const item = data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      profilePicture:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url ||
        null,
      stats: item.statistics || {},
    };
  }

  /** Fetch ALL videos (search results) for a channel, handle pagination */
  async function fetchAllChannelVideos(channelIdToFetch, apiKey) {
    console.log("[MusicCatalog] fetchAllChannelVideos for:", channelIdToFetch);
    const results = [];
    let nextPageToken = "";
    let pageCount = 0;
    const maxPerPage = CONFIG.MAX_RESULTS_PER_PAGE || 50;

    // We'll fetch up to a generous limit to avoid infinite loops; YouTube channels can be large.
    const MAX_PAGES = 1000;

    while (pageCount < MAX_PAGES) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelIdToFetch}&maxResults=${maxPerPage}&order=date&type=video${nextPageToken ? `&pageToken=${nextPageToken}` : ""}&key=${apiKey}`;
      console.log(`[MusicCatalog] fetching search page ${pageCount + 1}:`, url);

      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        // Detect rate limit
        if (res.status === 403) {
          throw new Error(
            `YouTube API quota exceeded or access forbidden (403). Message: ${txt}. Consider checking API key quota or project settings.`
          );
        }
        throw new Error(`YouTube search API failed: ${res.status} ${txt}`);
      }

      const data = await res.json();

      if (data.items && data.items.length > 0) {
        // append
        results.push(...data.items);
      }

      nextPageToken = data.nextPageToken || "";
      pageCount += 1;
      if (!nextPageToken) break;
    }

    return results;
  }

  /** Fetch videos details (statistics, contentDetails) in batches of up to 50 */
  async function fetchVideosDetailsBatched(videoIdArray, apiKey) {
    console.log("[MusicCatalog] fetchVideosDetailsBatched count:", videoIdArray.length);
    const map = {};
    const BATCH = 50;
    for (let i = 0; i < videoIdArray.length; i += BATCH) {
      const batchIds = videoIdArray.slice(i, i + BATCH).join(",");
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&maxResults=50&id=${batchIds}&key=${apiKey}`;
      console.log("[MusicCatalog] fetching video details batch:", url);
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to fetch video details: ${res.status} ${txt}`);
      }
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        data.items.forEach((it) => {
          map[it.id] = {
            duration: it.contentDetails?.duration,
            viewCount: it.statistics?.viewCount || 0,
            likeCount: it.statistics?.likeCount || 0,
            commentCount: it.statistics?.commentCount || 0,
          };
        });
      } else {
        console.warn("[MusicCatalog] video details batch returned no items");
      }
      // small pause could be added to be kind to rate limits; omitted to keep UX snappy
    }
    return map;
  }

  // ---------- UI helpers ----------
  function openVideoModal(video) {
    setSelectedVideo(video);
    // setTimeout ensures iframe is in DOM before setting src
    setTimeout(() => {
      if (modalIframeRef.current) {
        modalIframeRef.current.src = `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`;
      }
    }, 50);
    // trap focus etc. (lightweight)
    document.body.style.overflow = "hidden";
  }

  function closeVideoModal() {
    setSelectedVideo(null);
    if (modalIframeRef.current) {
      // stop playback by clearing src
      modalIframeRef.current.src = "";
    }
    document.body.style.overflow = "";
  }

  // Filter + sort logic wrapped in useMemo for performance
  const filteredVideos = useMemo(() => {
    return getFilteredVideos(videos, searchQuery, sortBy);
  }, [videos, searchQuery, sortBy]);

  // ---------- Render ----------
  return (
    <div className="music-catalog-root" aria-live="polite">
      <header className="mc-header">
        <div className="mc-channel">
          <div className="mc-avatar">
            {channelInfo?.profilePicture ? (
              <img src={channelInfo.profilePicture} alt={`${channelInfo.title} avatar`} />
            ) : (
              <div className="mc-avatar-placeholder">{channelInfo?.title?.[0] || "F"}</div>
            )}
          </div>
          <div className="mc-channel-meta">
            <h1 className="mc-channel-title">{channelInfo?.title || "Artist Name"}</h1>
            <div className="mc-channel-stats">
              <span>{channelInfo?.stats?.videoCount || videos.length} videos</span>
              <span>•</span>
              <span>{formatViews(channelInfo?.stats?.viewCount || totalViews(videos))} views</span>
            </div>
          </div>
        </div>

        <div className="mc-controls">
          <div className="mc-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search titles or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search videos"
            />
          </div>

          <div className="mc-sort">
            <Filter size={16} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort videos"
            >
              <option value="latest">Latest</option>
              <option value="mostViewed">Most Viewed</option>
              <option value="alpha">A - Z</option>
            </select>
          </div>
        </div>
      </header>

      <main className="mc-main">
        {loading ? (
          <div className="mc-loading">
            <div className="mc-spinner" role="status" aria-hidden="true" />
            <div className="mc-loading-text">Loading music catalog...</div>
          </div>
        ) : error ? (
          <div className="mc-error" role="alert">
            <h3>Unable to load music catalog</h3>
            <p>{error}</p>
            <div className="mc-error-tips">
              <strong>Troubleshooting tips:</strong>
              <ul>
                <li>Verify your API key in the CONFIG at the top of MusicCatalog.jsx.</li>
                <li>Check YouTube Data API v3 quota and enable the API in Google Cloud Console.</li>
                <li>If using a channel handle, try pasting the channel ID directly into CONFIG.CHANNEL_ID.</li>
                <li>Open the browser console for full debug logs (console.log statements are present).</li>
              </ul>
            </div>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="mc-empty">
            <h3>No videos found</h3>
            <p>Try clearing your search or changing sort options.</p>
          </div>
        ) : (
          <>
            <section className="mc-grid" role="list" aria-label="Video grid">
              {filteredVideos.map((v) => (
                <article
                  key={v.videoId}
                  className="mc-card"
                  role="listitem"
                  tabIndex={0}
                  aria-labelledby={`title-${v.videoId}`}
                  onClick={() => openVideoModal(v)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openVideoModal(v);
                  }}
                >
                  <div className="mc-thumb-wrap">
                    <img
                      src={
                        v.snippet.thumbnails?.high?.url ||
                        v.snippet.thumbnails?.medium?.url ||
                        v.snippet.thumbnails?.default?.url ||
                        ""
                      }
                      alt={v.snippet.title}
                      loading="lazy"
                      className="mc-thumb"
                    />
                    <span className="mc-duration-badge">
                      {formatDuration(v.details?.duration)}
                    </span>

                    <div className="mc-play-overlay" aria-hidden="true">
                      <Play size={36} />
                    </div>
                  </div>

                  <div className="mc-card-body">
                    <h4 id={`title-${v.videoId}`} className="mc-video-title">
                      {v.snippet.title}
                    </h4>

                    <div className="mc-card-stats">
                      <div className="mc-stat">
                        <Eye size={14} />
                        <span>{formatViews(v.details?.viewCount)}</span>
                      </div>
                      <div className="mc-stat">
                        <Heart size={14} />
                        <span>{formatViews(v.details?.likeCount)}</span>
                      </div>
                      <div className="mc-stat">
                        <Calendar size={14} />
                        <span>{formatDate(v.snippet.publishedAt)}</span>
                      </div>
                    </div>

                    <div className="mc-card-actions">
                      <a
                        href={`https://www.youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mc-btn mc-btn-watch"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Watch ${v.snippet.title} on YouTube`}
                      >
                        <Play size={14} /> Watch
                      </a>

                      <a
                        href={getDownloadLink(v.videoId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mc-btn mc-btn-download"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Download ${v.snippet.title}`}
                      >
                        <Download size={14} /> Download
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <footer className="mc-footer">
              <div>
                Showing <strong>{filteredVideos.length}</strong> of{" "}
                <strong>{videos.length}</strong> videos
              </div>
              <div className="mc-footer-links">
                <a
                  href={`https://www.youtube.com/channel/${channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open channel <ExternalLink size={14} />
                </a>
              </div>
            </footer>
          </>
        )}
      </main>

      {/* Modal */}
      {selectedVideo && (
        <div
          className="mc-modal-backdrop"
          onClick={(e) => {
            // close if clicking on backdrop
            if (e.target.classList.contains("mc-modal-backdrop")) closeVideoModal();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="mc-modal">
            <button className="mc-modal-close" onClick={closeVideoModal} aria-label="Close modal">
              <X size={18} />
            </button>

            <div className="mc-modal-content">
              <div className="mc-player">
                <iframe
                  ref={modalIframeRef}
                  title={selectedVideo.snippet.title}
                  allow="autoplay; encrypted-media"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>

              <div className="mc-modal-info">
                <h2 className="mc-modal-title">{selectedVideo.snippet.title}</h2>

                <div className="mc-modal-stats">
                  <div>
                    <Eye size={14} /> {formatViews(selectedVideo.details?.viewCount)}
                  </div>
                  <div>
                    <Heart size={14} /> {formatViews(selectedVideo.details?.likeCount)}
                  </div>
                  <div>
                    <Calendar size={14} /> {formatDate(selectedVideo.snippet.publishedAt)}
                  </div>
                </div>

                <div className="mc-modal-description">
                  <pre>{selectedVideo.snippet.description || "No description."}</pre>
                </div>

                <div className="mc-modal-actions">
                  <a
                    className="mc-btn mc-btn-watch"
                    href={`https://www.youtube.com/watch?v=${selectedVideo.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in YouTube <ExternalLink size={14} />
                  </a>
                  <a
                    className="mc-btn mc-btn-download"
                    href={getDownloadLink(selectedVideo.videoId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download <Download size={14} />
                  </a>
                  <button className="mc-btn mc-btn-close" onClick={closeVideoModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Helper functions not exported ----------
/** Compute total views across loaded videos (best-effort) */
function totalViews(videos) {
  if (!videos || videos.length === 0) return 0;
  return videos.reduce((acc, v) => acc + Number(v.details?.viewCount || 0), 0);
}

/** Apply filtering and sorting */
function getFilteredVideos(videos, query, sortBy) {
  let arr = Array.isArray(videos) ? videos.slice() : [];

  // SEARCH: case-insensitive in title or description
  if (query && query.trim().length > 0) {
    const q = query.trim().toLowerCase();
    arr = arr.filter((v) => {
      const t = v.snippet?.title?.toLowerCase() || "";
      const d = v.snippet?.description?.toLowerCase() || "";
      return t.includes(q) || d.includes(q);
    });
  }

  // SORT
  if (sortBy === "mostViewed") {
    arr.sort((a, b) => (Number(b.details?.viewCount || 0) - Number(a.details?.viewCount || 0)));
  } else if (sortBy === "alpha") {
    arr.sort((a, b) => {
      const A = (a.snippet?.title || "").toLowerCase();
      const B = (b.snippet?.title || "").toLowerCase();
      return A.localeCompare(B);
    });
  } else {
    // latest: order by publishedAt desc
    arr.sort((a, b) => new Date(b.snippet?.publishedAt || 0) - new Date(a.snippet?.publishedAt || 0));
  }

  return arr;
}
