export const formatActivityName = (name: string) => {
    if (name === 'PPE') {
        return 'PPE';
    }
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}; 