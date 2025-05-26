import React from 'react';
import styles from './AccountPage.module.css';
import UserProfile from '../../components/account/UserProfile';

import ItemList from '../../components/common/ItemList';
import BetHistoryItem from '../../components/account/BetHistoryItem';
const AccountPage: React.FC = () => {
  const dummyUser = {
    name: 'Harry Potter',
    email: 'harry.potter@hogwarts.ac.uk',
  };

  const dummyBalance = 500; // Dummy balance

  const dummyBetHistory = [
    {
      id: 1,
      match: 'Gryffindor vs Slytherin',
      option: 'Gryffindor Win',
      amount: 50,
      result: 'win',
      payout: 100,
    },
    {
      id: 2,
      match: 'Hufflepuff vs Ravenclaw',
      option: 'Ravenclaw Win',
      amount: 30,
      result: 'loss',
      payout: 0,
    },
    {
      id: 3,
      match: 'Gryffindor vs Hufflepuff',
      option: 'Draw',
      amount: 20,
      result: 'pending', // Added result for pending bet
    }, // Example of a bet on a match not yet resulted
  ];

  return (
    <div className={styles.accountPageContainer}>
      <h1 className={styles.accountPageTitle}>My Account</h1>
      <div className={styles.userInfoContainer}>
        <h2>Profile Information</h2>
        <UserProfile name={dummyUser.name} email={dummyUser.email} />
        <p>Balance: {dummyBalance} Galleons</p> {/* Display dummy balance */}
      </div>
      <div className={styles.bettingHistoryContainer}>
        <ItemList
 items={dummyBetHistory}
 renderItem={(bet) => <BetHistoryItem bet={bet} />}
 title="Betting History"
        />
      </div>
    </div>
  );
};

export default AccountPage;