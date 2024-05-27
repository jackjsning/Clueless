// pages/_app.js
import 'bootstrap/dist/css/bootstrap.css';

import { useRouter } from 'next/router';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  const router = useRouter(); 
  useEffect(() => {
 
  }, []);
  return <Component {...pageProps} />;
}

export default MyApp;
