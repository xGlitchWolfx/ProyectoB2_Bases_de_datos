import { useNavigate } from "react-router-dom";

export default function Header({ title }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="py-3 mb-3" style={{ backgroundColor: "#ffc400ff" }}>
      <div className="container d-flex justify-content-between align-items-center">
        <h4 className="mb-0" style={{ color: "white", fontWeight: "bold" }}>{title || "Sistema de Ventas"}</h4>
        
        {localStorage.getItem("token") && (
          <button onClick={handleLogout} className="btn btn-danger btn-sm">
            Cerrar Sesión
          </button>
        )}
      </div>
    </header>
  );
}
