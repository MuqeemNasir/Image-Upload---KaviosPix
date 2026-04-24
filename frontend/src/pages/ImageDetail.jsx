import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api";

export default function ImageDetail() {
    const { albumId, imageId} = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const [image, setImage] = useState(location.state?.image)
    const [comment, setComment] = useState("")
    const [confirmDelete, setConfirmDelete] = useState(false)

    if(!image){
        return (
            <div className="mt-5 text-center">
                Image data not found. Please go back.
            </div>
        )
    }

    const toggleFavorite = async() => {
        try {
            const res = await api.put(`/albums/${albumId}/images/${imageId}/favorite`, {isFavorite: !image.isFavorite})
            if(res.data) setImage(res.data)
        } catch (error) {
            console.error(error)
        }
    }

    const addComment = async() => {
        if(!comment) return
        try {
            const res = await api.post(`/albums/${albumId}/images/${imageId}/comments`, {comment})
            if(res.data){
                setImage(res.data)
                setComment("")
            }
        } catch (error) {
            console.error(error)
        }
    }

    const deleteImage = async() => {
        try {
            await api.delete(`/albums/${albumId}/images/${imageId}`)
            navigate(`/albums/${albumId}`)
        } catch (error) {
            console.error(error)
        }
    }

    return(
        <div className="row justify-content-center">
            <div className="col-md-8">
                <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>&larr; Back</button>

                <div className="card shadow">
                    <img src={image.imageUrl} alt={image.name} className="card-img-top" />
                    <div className="card-body">
                        <h4 className="card-title d-flex justify-content-between">
                            {image.name}
                            <button className={`btn btn-sm ${image.isFavorite ? 'btn-warning' : 'btn-outline-warning'}`} onClick={toggleFavorite}>
                                {image.isFavorite ? "⭐ Favorited" : "☆ Mark Favorite" }
                            </button>
                        </h4>
                        <hr />
                        <h5>Image Details</h5>
                        <div className="row text-muted mb-3">
                            <div className="col-6">
                                <p className="mb-1"><b>Size: </b>{(image.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <div className="col-6">
                                <p className="mb-1"><b>Uploaded: </b>{new Date(image.uploadedAt).toLocaleString()}</p>
                            </div>
                            <div className="col-6">
                                <p className="mb-1"><b>Person: </b>{image.person || "N/A"}</p>
                            </div>
                            <div className="col-6">
                                <p className="mb-1"><b>Tags: </b>{image.tags?.length > 0 ? image.tags.join(", ") : "None"}</p>
                            </div>
                        </div>

                            {!confirmDelete ? (
                                <button className="btn btn-danger w-100 mb-4" onClick={() => setConfirmDelete(true)}>Trash Image</button>
                            ) : (
                                <div className="d-flex gap-2 mb-4">
                                    <button className="btn btn-danger w-50" onClick={deleteImage}>Yes, Delete it</button>
                                    <button className="btn btn-secondary w-50" onClick={() => setConfirmDelete(false)}>Cancel</button>
                                </div>
                            )}
                            <hr />
                            <h5>Comments</h5>
                            <ul className="list-group mb-3">
                                {image.comments?.map((c, idx) => (
                                    <li key={idx} className="list-group-item">
                                        {c}
                                    </li>
                                ))}
                                {(!image.comments || image.comments.length === 0) && <li className="list-group-item text-muted">No comments yet.</li> }
                            </ul>

                            <div className="d-flex gap-2">
                                <input type="text" className="form-control" value={comment} onChange={(e) =>  setComment(e.target.value)} placeholder="Write a comment..." />
                                <button className="btn btn-primary" onClick={addComment}>Post</button>
                            </div>
                    </div>
                </div>
            </div>
        </div>
    )
}