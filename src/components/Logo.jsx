// The horizontal logo, with the white version in the dark theme.
export default function Logo({ className = 'logo-wide' }) {
  return (
    <>
      <img src="/logo-horizontal.png" alt="Roosevelt Pups" className={`${className} logo-for-light`} />
      <img src="/logo-horizontal-white.png" alt="Roosevelt Pups" className={`${className} logo-for-dark`} />
    </>
  )
}
