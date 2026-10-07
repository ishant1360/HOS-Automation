import { test } from '../fixtures/test.fixture';
import { appendSelectedRoom } from '../utils/selected-room-report';

test('books a room from the wishlist', async ({ page, loginPage, wishlistPage }) => {

  await loginPage.open();
  await loginPage.loginWithEmailVerification('bhbirla@bestpeers.com');
  await loginPage.expectLoggedIn();

  await wishlistPage.openWishlist();
  await wishlistPage.openWishlistProperty();
  await wishlistPage.openFirstRoom();
  const selectedRoom = await wishlistPage.getSelectedRoomDetails();
  appendSelectedRoom({
    testName: test.info().title,
    ...selectedRoom,
  });
  await wishlistPage.bookRoom();
});
