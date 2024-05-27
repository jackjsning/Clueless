import Link from 'next/link';
import Signin from '../components/signin';

export default function HomePage() {
    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="container-fluid">
                    <Link href="/" className="navbar-brand">
                        Clueless Game
                 </Link>
                </div>
            </nav>

            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card">
                            <div className="card-header bg-primary text-white">
                                🕵️ Clueless Game 🕵️ 
                            </div>
                            <div className="card-body">
                                <h5 className="card-title">Welcome to Clueless Game</h5>
                                <p className="card-text">Sign in to start the adventure and solve the mystery!</p>

                                <Signin />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
