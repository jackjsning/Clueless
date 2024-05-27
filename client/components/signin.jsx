// components/Signup.js
import { useState, Storage } from 'react';
import { useRouter } from 'next/router';

function Signin() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const router = useRouter();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Make a POST request to your signup API endpoint with formData
      const response = await fetch('http://127.0.0.1:5000/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        sessionStorage.setItem('username', formData.username);
        router.push('/dashboard');
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mt-5">
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-group mb-3">
          <input 
            type="text"
            className="form-control"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group mb-3">
          <input 
            type="password"
            className="form-control"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Sign In
        </button>
      </form>
    </div>
  );
}

export default Signin;
