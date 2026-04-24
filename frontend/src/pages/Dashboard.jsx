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

  const handleUpdate = async(albumId) => {
    const newDesc = window.prompt("Enter new description for this album.")
    if(!newDesc) return

    try {
      await api.put(`/albums/${albumId}`, {description: newDesc})
      fetchAlbums()
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || "Failed to update description.")
    }
  }

  const handleShare = async(albumId) => {
    const email = window.prompt("Enter the email of the user to share with (they must be registered)")

    if(!email) return

    try {
      await api.put(`/albums/${albumId}/share`, {emails: [email]})
      alert(`Successfully shared album with ${email}!`)
      fetchAlbums()
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || "Failed to share album. Make sure the user exists.")
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
                    <input className="form-control" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (Optional)" required/>
                    <button type="submit" className="btn btn-success">Create</button>
                </form>
            </div>
        </div>

        <div className="row">
            {albums.map(album => (
                <div key={album.albumId} className="col-md-4 mb-4">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title text-primary" style={{cursor: "pointer"}} onClick={() => navigate(`/albums/${album.albumId}`, {state: {album}})}>
                                📁 {album.name}
                            </h5>
                            <p className="card-text text-muted mb-2">{album.description || "No Description"}</p>
                            <small className="text-secondary d-block mb-3">{album.sharedUsers?.length > 0 ? `Shared with: ${album.sharedUsers.join(', ')}` : "Private"}</small>
                        </div>
                        <div className="card-footer bg-white d-flex flex-wrap gap-2 justify-content-center">
                            <button className="btn btn-sm btn-primary" onClick={() => navigate(`/albums/${album.albumId}`, {state: {album}})}>Open</button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleUpdate(album.albumId)}>Edit</button>
                            <button className="btn btn-sm btn-outline-info" onClick={() => handleShare(album.albumId)}>Share</button>
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
