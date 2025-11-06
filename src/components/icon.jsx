export default function AppIcon({ ic, className }) {
  return <span className={`${className || ''} mdi mdi-${ic}`}></span>
}
