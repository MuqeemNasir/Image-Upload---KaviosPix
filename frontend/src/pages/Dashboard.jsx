import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useEffect } from "react";

export default function Dashboard() {
  const [albums, setAlbums] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchAlbums = async () => {
    try {
      const res = await api.get(`/albums`);
      if (res.data) setAlbums(res.data);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load Albums");
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!name) return setMessage("Album name is required.");

    try {
      await api.post(`/albums`, { name, description });
      setName("");
      setDescription("");
      fetchAlbums();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (albumId) => {
    if(!window.confirm("Delete this album?")) return

    try {
        await api.delete(`/albums/${albumId}`)
        fetchAlbums()
    } catch (error) {
        console.error(error)
    }
  }

  return(
    <div>
        <h2 className="mb-4">Your Albums</h2>
        {message && <div className="alert alert-danger">{message}</div> }

        <div className="card mb-4 shadow-sm">
            <div className="card-body">
                <h5 className="card-title">Create New Album</h5>
                <form onSubmit={handleCreate} className="d-flex gap-2">
                    <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Album Name" required/>
                    <input className="form-control" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required/>
                    <button type="submit" className="btn btn-success">Create</button>
                </form>
            </div>
        </div>

        <div className="row">
            {albums.map(album => (
                <div key={album.albumId} className="col-md-4 mb-3">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title text-primary" style={{cursor: "pointer"}} onClick={() => navigate(`/albums/${album.albumId}`, {state: {album}})}>
                                📁 {album.name}
                            </h5>
                            <p className="card-text text-muted">{album.description || "No Description"}</p>
                        </div>
                        <div className="card-footer bg-white d-flex justify-content-between">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(album.albumId)}>Delete</button>
                        </div>
                    </div>
                </div>
            ))}

            {albums.length === 0 && <p className="text-muted">No albums found. Create one above!</p> }
        </div>
    </div>
  )
}
