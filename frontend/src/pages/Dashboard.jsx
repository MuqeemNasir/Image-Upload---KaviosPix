import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useEffect } from "react";

export default function Dashboard() {
  const [albums, setAlbums] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("")
  const navigate = useNavigate();

  const [activeAction, setActiveAction] = useState({albumId: null, type: null})
  const [actionInput, setActionInput] = useState("")

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
      setMessage("Failed to create Album")
    }
  };

  const handleActionSubmit = async(albumId) => {
    try {
      setMessage("")
      setSuccessMsg("")

      if(activeAction.type = "edit"){
        if(!actionInput) return setMessage("Description cannot be empty")
        await api.put(`/albums/${albumId}`, {description: actionInput})
        setSuccessMsg("Description updated!")
      }else if(activeAction.type === "share"){
        if(!actionInput) return setMessage("Email cannot be empty")
        await api.post(`/albums/${albumId}/share`, {emails: [actionInput]})
        setSuccessMsg(`Album shared with ${actionInput}!`)
      }
      else if(activeAction.type === "delete"){
        await api.delete(`/albums/${albumId}`)
        setSuccessMsg("Album deleted.")
      }

      setActiveAction({albumId: null, type: null})
      setActionInput("")
      fetchAlbums()
    } catch (error) {
      console.error(error)
      setMessage(error.response?.data?.message || "Action Failed.")
    }
  }

  const openAction = (albumId, type) => {
    setActiveAction({albumId, type})
    setActionInput("")
  }

  return(
    <div>
        <h2 className="mb-4">Your Albums</h2>
        {message && <div className="alert alert-danger">{message}</div> }
        {successMsg && <div className="alert alert-success">{successMsg}</div> }

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
                        <div className="card-footer bg-white">
                          {activeAction.albumId === album.albumId ? (
                            <div className="d-flex flex-column gap-2">
                              {activeAction.type === 'delete' ? (
                                <span className="text-danger fw-bold">Are you sure you want to delete this?</span>
                              ) : (
                                <input type={activeAction.type === 'share' ? "email": "text"} className="form-control form-control-sm" placeholder={activeAction.type === 'share' ? 'Enter email address...': 'Enter new description...'} value={actionInput} onChange={(e) => setActionInput(e.target.value)} />
                              )}
                              <div className="d-flex gap-2">
                                <button className={`btn btn-sm w-50 ${activeAction.type === 'delete' ? 'btn-danger' : 'btn-success'}`} onClick={() => handleActionSubmit(album.albumId)}>Confirm</button>
                                <button className="btn btn-sm btn-secondary w-50" onClick={() => setActiveAction({albumId: null, type: null})}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="d-flex flex-wrap gap-2 justify-content-center">
                              <button className="btn btn-sm btn-primary" onClick={() => navigate(`/albums/${album.albumId}`, {state: {album}})}>Open</button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => openAction(album.albumId, 'edit')}>Edit</button>
                              <button className="btn btn-sm btn-outline-info" onClick={() => openAction(album.albumId, 'share')}>Share</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => openAction(album.albumId, 'delete')}>Delete</button>
                            </div>
                          )}
                        </div>
                    </div>
                </div>
            ))}

            {albums.length === 0 && <p className="text-muted">No albums found. Create one above!</p> }
        </div>
    </div>
  )
}
