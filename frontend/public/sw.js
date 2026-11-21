self.addEventListener('push', function(event) {
  let data = { title: 'RideShare', message: 'You have a new update.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (_e) {
      data = { title: 'RideShare', message: event.data.text() };
    }
  }

  const options = {
    body: data.body || data.message,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
