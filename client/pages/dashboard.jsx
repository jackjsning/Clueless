import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.css'; 
function Dashboard() {
    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <Link href="/" className="navbar-brand" >
            Clueless Game
          </Link>
          
          <div className="navbar-nav d-flex flex-row">
            <li className="nav-item mr-3">
              <Link href="/game_console" className="nav-link">
                Start Game
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/" className="nav-link" >
                 Home
              </Link>
            </li>
          </div>
        </div>
      </nav>
    );
}

export default Dashboard;
