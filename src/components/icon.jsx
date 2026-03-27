export default function AppIcon({ ic, className, size = 'normal' }) {
  return <span className={`${className || ''} mdi mdi-${ic} fs-${size} ic`}></span>
}
