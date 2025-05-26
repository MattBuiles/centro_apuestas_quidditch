import React, { ReactNode } from 'react';

interface ItemListProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
}

const ItemList = <T,>({ title, items, renderItem }: ItemListProps<T>) => {
  return (
    <div>
      <h2>{title}</h2>
      {items.length > 0 ? (
        <ul>
          {items.map((item, index) => (
            <li key={index}>
              {renderItem(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No items to display.</p>
      )}
    </div>
  );
};

export default ItemList;