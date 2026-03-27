export function formatMemberSince(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const day = date.getDate();
    return `${day} ${month} ${year}`;
}

export function formatPublishDate(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}, ${day}, ${year}`;
}