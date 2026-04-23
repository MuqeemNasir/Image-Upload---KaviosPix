import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useEffect } from "react";
import { useRef } from "react";

export default function AlbumView() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const album = location.state?.album || { name: "Album" };

  const [images, setImages] = useState([]);
  const [tagSearch, setTagSearch] = useState("");
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState("");
  const [person, setPerson] = useState("");

  const fileInputRef = useRef(null)

  const fetchImages = async (query = "") => {
    try {
      const res = await api.get(`/albums/${albumId}/images${query}`);
      if (res.data) return setImages(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [albumId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select an Image.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("person", person);
    if (tags) {
      const tagsArr = tags.split(",").map((t) => t.trim());
      formData.append("tags", JSON.stringify(tagsArr));
    }

    try {
      await api.post(`/albums/${albumId}/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFile(null);
      setTags("");
      setPerson("");

      if(fileInputRef.current){
        fileInputRef.current.value = ""
      }

      fetchImages();
    } catch (error) {
      console.error(error);
      alert("Upload failed.");
    }
  };

  return (
    <div>
      <button className="btn btn-secondary mb-3" onClick={() => navigate("/")}>
        &larr; Back to Albums
      </button>
      <h2>📁 {album.name}</h2>
      <hr />

      <div className="card mb-4 shadow-sm bg-light">
        <div className="card-body">
          <h5 className="card-title">Upload New Image</h5>
          <form onSubmit={handleUpload} className="row g-2 align-items-center">
            <div className="col-auto">
              <input
                type="file"
                className="form-control"
                onChange={(e) => setFile(e.target.files[0])}
                ref={fileInputRef}
              />
            </div>
            <div className="col-auto">
              <input
                type="text"
                className="form-control"
                placeholder="Tags (e.g. nature, sky"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="col-auto">
              <input
                type="text"
                className="form-control"
                placeholder="Person"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
              />
            </div>
            <div className="col-auto">
              <button type="submit" className="btn btn-primary">
                Upload
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="d-flex gap-2 mb-4">
        <input
          type="text"
          className="form-control w-25"
          placeholder="Search by Tag..."
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value)}
        />
        <button
          className="btn btn-outline-primary"
          onClick={() => fetchImages(`?tags=${tagSearch}`)}
        >
          Search
        </button>
        <button
          className="btn btn-outline-success"
          onClick={() => fetchImages("/favorites")}
        >
          Favorites Only
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => {
            setTagSearch("");
            fetchImages();
          }}
        >
          Clear
        </button>
      </div>

      <div className="row">
        {images.map((img) => (
          <div key={img.imageId} className="col-md-3 mb-4">
            <div
              className="card h-100 shadow-sm"
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate(`/albums/${albumId}/images/${img.imageId}`, {
                  state: { image: img },
                })
              }
            >
              <img
                src={img.imageUrl}
                alt={img.name}
                className="card-img-top"
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="card-body p-2 text-center">
                <p className="card-text text-truncate mb-0 fw-bold">
                  {img.name}
                </p>
                {img.isFavorite && (
                  <span className="badge bg-warning text-dark mt-1">
                    ⭐ Favorited
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {images.length === 0 && <p className="text-muted">No images found.</p>}
      </div>
    </div>
  );
}
