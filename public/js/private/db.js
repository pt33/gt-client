
    var myDB={
        name:'library',
        version:4,
        db:null
    }

    // setTimeout(function(){
    //     closeDB(myDB.db);
    //     deleteDB(myDB.name)
    // },500)

    function openDB () {
        var version=myDB.version || 1;
        var request=window.indexedDB.open(myDB.name,version);
        request.onerror=function(e){
            console.log(e.currentTarget.error.message);
        }
        request.onsuccess=function(e){
            console.log('aaaaa')
            myDB.db=e.target.result;
            clearObjectStore('images')
            clearObjectStore('contents')
        }
        request.onupgradeneeded=function(e){
            var db=e.target.result;
            if(!db.objectStoreNames.contains('images')){
                var store=db.createObjectStore('images',{keyPath: 'key'});
                store.createIndex('keyIndex','key',{unique:true})
            }
            if(!db.objectStoreNames.contains('contents')){
                var store=db.createObjectStore('contents',{keyPath: 'key'});
                // store.createIndex('contentIndex','content',{unique:true})
            }
            console.log('DB version changed to '+version);
        }
    }


    function openDBByFetch (storeName, range, obj) {
        var version=myDB.version || 1;
        var request=window.indexedDB.open(myDB.name,version);
        request.onerror=function(e){
            console.log(e.currentTarget.error.message);
        }
        request.onsuccess=function(e){
            console.log('aaaaa')
            myDB.db=e.target.result;
            fetchStoreByCursor(storeName, range, obj)
        }
        request.onupgradeneeded=function(e){
            var db=e.target.result;
            if(!db.objectStoreNames.contains('images')){
                var store=db.createObjectStore('images',{keyPath: 'key'});
                store.createIndex('keyIndex','src',{unique:true})
            }
            if(!db.objectStoreNames.contains('contents')){
                var store=db.createObjectStore('contents',{keyPath: 'key'});
                // store.createIndex('contentIndex','content',{unique:true})
            }
            console.log('DB version changed to '+version);
        }
    }

    function fetchStoreByCursor(storeName, range, obj){
        var transaction=myDB.db.transaction(storeName)
        var store=transaction.objectStore(storeName)
        var request
        if (range) {
            console.log(range)
            var ary = range.split(',')
            var index = store.index("keyIndex");
            request = index.openCursor(IDBKeyRange.bound(ary[0],ary[ary.length-1],false,false))
        } else {
            request=store.openCursor()
        }
        var result = []
        request.onsuccess=function(e){
            var cursor=e.target.result
            if(cursor){
                console.log(cursor.key)
                result.push(cursor.value.value)
                cursor.continue()
            } else {
                obj.trigger('click',[result, range ? 'image' : 'content'])
            }
        }
    }

    function getDataByIndex(db,storeName,storeIndex){
        var transaction=db.transaction(storeName);
        var store=transaction.objectStore(storeName);
        var index = store.index(storeIndex);
        index.get('Byron').onsuccess=function(e){
            var student=e.target.result;
            console.log(student.id);
        }
    }

    function addData(storeName,data){
        console.log('bbbb')
        var transaction=myDB.db.transaction(storeName,'readwrite')
        var store=transaction.objectStore(storeName)
        store.put(data)
        console.log('adddata success')
    }

    function clearObjectStore(storeName){
        var transaction=myDB.db.transaction(storeName,'readwrite');
        if (transaction) {
            var store=transaction.objectStore(storeName);
            store.clear()
        }
    }

    // // Create/open database
    // var request = indexedDB.open("elephantFiles", dbVersion),db,
    //
    //     createObjectStore = function (dataBase) {
    //         // Create an objectStore
    //         console.log("Creating objectStore")
    //         var db=e.target.result;
    //         if(!db.objectStoreNames.contains('images')){
    //             db.createObjectStore('images',{keyPath:"id"})
    //         }
    //         if(!db.objectStoreNames.contains('contents')){
    //             db.createObjectStore('contents')
    //         }
    //         console.log('DB version changed to '+version);
    //     }
    //
    //     getImages = function () {
    //         // Code for getting images as a blob through WebActivities from Camera, Gallery etc
    //         // Then:
    //         var transaction=db.transaction('images','readwrite');
    //         var objectStore = transaction.objectStore("images");
    //         var images = []
    //
    //         objectStore.openCursor().onsuccess = function(event) {
    //             images.put(event.target.result.value)
    //         }
    //         return images
    //     }
    //
    //     getContents = function () {
    //         // Code for getting images as a blob through WebActivities from Camera, Gallery etc
    //         // Then:
    //         var transaction = db.transaction(["contents"], "readonly");
    //         var objectStore = transaction.objectStore("contents");
    //         var contents = []
    //
    //         objectStore.openCursor().onsuccess = function(event) {
    //             contents.put(event.target.result)
    //         }
    //         return contents
    //     }
    //
    //     putImageInDb = function (image) {
    //         console.log("Putting images in IndexedDB");
    //
    //         // Open a transaction to the database
    //         var transaction = db.transaction(["images"], "readwrite");
    //
    //         // Put the blob into the dabase
    //         transaction.objectStore("images").add(image);
    //     }
    //
    //     putContentInDb = function (blob) {
    //         console.log("Putting contents in IndexedDB");
    //
    //         // Open a transaction to the database
    //         var transaction = db.transaction(["contents"], "readwrite");
    //
    //         // Put the blob into the dabase
    //         transaction.objectStore("contents").add(blob);
    //     }
    //
    //     request.onerror = function (event) {
    //         console.log("Error creating/accessing IndexedDB database");
    //     };
    //
    //     request.onsuccess = function (event) {
    //         console.log("Success creating/accessing IndexedDB database");
    //         db = request.result;
    //
    //         db.onerror = function (event) {
    //             console.log("Error creating/accessing IndexedDB database");
    //         };
    //
    //         // getImageFile()
    //     }
    //
    //     // For future use. Currently only in latest Firefox versions
    //     request.onupgradeneeded = function (event) {
    //         createObjectStore(event.target.result);
    //     }



