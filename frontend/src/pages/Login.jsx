export default function Login() {
    const handleLogin=() => {
        window.location.href = "http://localhost:4000/auth/google"
    }

    return(
        <div className="container d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
            <div className="card shadow p-5 text-center">
                <h2 className="mb-4">📸 KaviosPix</h2>
                <p className="text-muted mb-4">Sign in to manage your albums and images.</p>
                <button className="btn btn-primary" onClick={handleLogin}>Sign in with Google</button>
            </div>
        </div>
    )
}