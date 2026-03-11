// ============================
// ITEMS MODULE
// ============================

import { getStorage, setStorage } from "./storage.js";

const ITEMS_KEY = "items";

export function getItems() {
    return getStorage(ITEMS_KEY) || [];
}

export function saveItems(items) {
    setStorage(ITEMS_KEY, items);
}

export function addItem(itemData) {

    const items = getItems();

    const newItem = {
        id: Date.now(),
        ...itemData,
        status: "active",
        timestamp: Date.now()
    };

    items.unshift(newItem);

    saveItems(items);

    return newItem;
}

export function getItemById(id) {

    const items = getItems();

    return items.find(item => item.id === parseInt(id));
}

export function updateItem(id, updates) {

    const items = getItems();

    const index = items.findIndex(i => i.id === parseInt(id));

    if (index !== -1) {

        items[index] = {
            ...items[index],
            ...updates
        };

        saveItems(items);

        return items[index];
    }

    return null;
}

export function deleteItem(id) {

    const items = getItems();

    const filtered = items.filter(item => item.id !== parseInt(id));

    saveItems(filtered);
}