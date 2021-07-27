export default interface Key {
    key: string,
    title?: string,
    sort?: boolean,
    filter?: 'input' | 'select'
}