export default function setVisualLogActive (domElementId, maxMessageLength = 100) {
  const oldLog = console.log

  console.log = function (...args) {
    const domElement = document.getElementById(domElementId)
    if (domElement) {
      // Convert all arguments to strings and join them
      const logMessage = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
      ).join(' ')

      // Truncate the message if it's too long
      const truncatedMessage = logMessage.length > maxMessageLength
        ? logMessage.substring(0, maxMessageLength) + '...'
        : logMessage

      domElement.innerHTML += `${truncatedMessage}<br><hr>`
    }

    oldLog.apply(console, args) // Call the original console.log
  }
}
