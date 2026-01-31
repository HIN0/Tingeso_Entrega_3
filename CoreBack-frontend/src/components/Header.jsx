import { useKeycloak } from "@react-keycloak/web";

export default function Header() {
  const { keycloak, initialized } = useKeycloak();
  if (!initialized) return null;

  const isAuth = !!keycloak?.authenticated;
  const token = isAuth ? keycloak.tokenParsed : null;

  const username = token?.preferred_username ?? "Invitado";
  const email = token?.email ?? "—";
  const givenName = token?.given_name ?? "";
  const familyName = token?.family_name ?? "";
  const roles = Array.isArray(token?.realm_access?.roles) ? token.realm_access.roles : [];
  const isAdmin = roles.includes("ADMIN");

  return (
    <header style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:"1px solid #e5e7eb"}}>
      <strong>ToolRent</strong>
      <div style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:10}}>
        {isAuth && (
          <>
            <span>{givenName || familyName ? `${givenName} ${familyName}`.trim() : username}</span>
            <span style={{opacity:0.7}}>{email}</span>
            <span style={{padding:"2px 10px",border:"1px solid #9ca3af",borderRadius:999}}>
              {isAdmin ? "Admin" : "Empleado"}
            </span>
            <button onClick={() => keycloak.accountManagement()}>Mi cuenta</button>
            <button onClick={() => keycloak.logout({ redirectUri: window.location.origin })}>Logout</button>
          </>
        )}
        {!isAuth && (
          <button onClick={() => keycloak.login()}>Login</button>
        )}
      </div>
    </header>
  );
}
