// Definitions to let TS understand .vs, .fs shader files

declare module '*.fs' {
	const value: string
	export default value
}
declare module '*.vs' {
	const value: string
	export default value
}
