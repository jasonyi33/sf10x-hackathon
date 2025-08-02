'use client';
import dynamic from 'next/dynamic';
import styles from "./page.module.css";
import '@maptiler/sdk/dist/maptiler-sdk.css';

// Dynamic import to handle client-side rendering for WebGL
const SanFrancisco3D = dynamic(() => import('./components/SanFrancisco3D'), {
  ssr: false,
  loading: () => <p>Loading 3D San Francisco Map...</p>
});

// export default function Home() {
//   return (
//     <div className={styles.page}>
//       <main className={styles.main}>
//         <h1 style={{ margin: '20px 0', color: '#333' }}>
//           PulsePoint SF - 3D Map Test
//         </h1>

//         <div style={{ width: '100%', marginBottom: '20px' }}>
//           <SanFrancisco3D />
//         </div>

//         <p style={{ textAlign: 'center', color: '#666' }}>
//           Basic deck.gl integration test - San Francisco 3D view
//         </p>
//       </main>
//     </div>
//   );
// }

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 style={{ margin: '20px 0', color: '#333', textAlign:'center' }}>
          PulsePoint SF - 3D Map Test
        </h1>

        <div className="test" style={{ width: '100%', marginBottom: '20px' }}>
          <SanFrancisco3D />
        </div>


        <p style={{ textAlign: 'center', color: '#666' }}>
          Basic deck.gl integration test - San Francisco 3D view
        </p>
      </main>
    </div>
  );
}

// export default function Home() {
//   return (
//     <div className={styles.page}>
//         <div className="test" style={{ width: '100%', marginBottom: '20px' }}>
//           <SanFrancisco3D />
//         </div>
//     </div>
//   );
// }