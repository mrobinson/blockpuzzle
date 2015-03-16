var emptyData = {
    tracks: [ ]
};

QUnit.test("convertTextToData values", function(assert) {
    var data = BlockPuzzle.convertTextToData("value: nice");
    assert.propEqual(data, {tracks: [], value: "nice"});

    var data = BlockPuzzle.convertTextToData("value: 42");
    assert.propEqual(data, {tracks: [], value: "42"}, "Simple example");

    var data = BlockPuzzle.convertTextToData("value: \twhitespace\tin\tthe\tmiddle\t");
    assert.propEqual(data, {tracks: [], value: "whitespace\tin\tthe\tmiddle"}, "Whitespace should be trimmed");

    var data = BlockPuzzle.convertTextToData("value: a longer string with spaces");
    assert.propEqual(data, {tracks: [], value: "a longer string with spaces"}, "Simple example with spaces");
});

QUnit.test("convertTextToData tracks", function(assert) {
    var simpleTrack = {
        tracks: [ { name: 'user1', reservations: []} ],
        value: "42",
    }

    var data = BlockPuzzle.convertTextToData("value: 42\n* user1\n");
    assert.propEqual(data, simpleTrack, "Whitespace shouldn't matter");

    var data = BlockPuzzle.convertTextToData("value: 42\n*\tuser1\t\n");
    assert.propEqual(data, simpleTrack, "Whitespace shouldn't matter.");

    var data = BlockPuzzle.convertTextToData("value: 42\n*user1");
    assert.propEqual(data, simpleTrack, "Whitespace shouldn't matter.");

    var data = BlockPuzzle.convertTextToData("*user1\nvalue: 42\n");
    assert.propEqual(data, simpleTrack, "Order shouldn't matter.");

    var simpleTrack2 = {
        tracks: [ { name: 'User One', reservations: []} ],
    }

    var data = BlockPuzzle.convertTextToData(" * User One ");
    assert.propEqual(data, simpleTrack2, "Track name should support whitespace.");

    var multipleTracks = {
        tracks: [
            { name: 'User One', reservations: []},
            { name: 'User Two', reservations: []},
            { name: 'User Three', reservations: []},
        ],
    };

    var data = BlockPuzzle.convertTextToData(" * User One \n * User Two\t\n* User Three\t");
    assert.propEqual(data, multipleTracks, "Multiple tracks.");

    var data = BlockPuzzle.convertTextToData(" * \t\t");
    assert.propEqual(data, emptyData, "Don't add track with empty track name.");
});

QUnit.test("convertTextToData reservations", function(assert) {
    var simpleReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One',  
                              start: new Date(2001, 0, 1, 0, 0, 0, 0),
                              end: new Date(2001, 2, 31, 0, 0, 0, 0) } ],
        } ],
    };

    var data = BlockPuzzle.convertTextToData("* User One\n - Reservation One: Q1/2001");
    assert.propEqual(data, simpleReservation, "Simple reservation");

    var rangeReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One', 
                              start: new Date(2009, 0, 21, 0, 0, 0, 0),
                              end: new Date(2009, 1, 23, 0, 0, 0, 0) } ],
        } ],
    };

    var data = BlockPuzzle.convertTextToData("* User One\n - Reservation One: 1/21/2009-2/23/2009");
    assert.propEqual(data, rangeReservation, "Reservation with more complex range");

    var rangeReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One',
                              start: new Date(2009, 5, 1, 0, 0, 0, 0),
                              end: new Date(2009, 11, 31, 0, 0, 0, 0) } ],
        } ],
    };

    var data = BlockPuzzle.convertTextToData("* User One\n - Reservation One: Q3/2009-Q4/2009");
    assert.propEqual(data, rangeReservation, "Reservation with more complex range");

    var data = BlockPuzzle.convertTextToData(" - Reservation One: Q3/2009-Q4/2009");
    assert.propEqual(data, emptyData, "Don't add data when there is no current track.");

    var data = BlockPuzzle.convertTextToData("\t\n - \tReservation One: Q3/2009-Q4/2009");
    assert.propEqual(data, emptyData, "Don't add data when there is no current track.");

    var emptyTrack = {
        tracks: [ {
            name: 'User One',
            reservations: [ ],
        } ],
    };

    var data = BlockPuzzle.convertTextToData("* User One\n - \t: Q3-Q4");
    assert.propEqual(data, emptyTrack, "Don't add reservation when the name is empty.");
});

QUnit.test("dateStringToDate", function(assert) {
    assert.equal(BlockPuzzle.dateStringToDate("01/01/2001").getTime(),
                 (new Date(2001, 0, 1, 0, 0, 0, 0)).getTime(),
                 "Simple date.");
    assert.equal(BlockPuzzle.dateStringToDate("01/01/01"), null,
                 "Two digit years not supported.");
    assert.equal(BlockPuzzle.dateStringToDate("Q1/2012").getTime(),
                 (new Date(2012, 0, 1, 0, 0, 0, 0)).getTime(),
                 "Simple quarter.");
    assert.equal(BlockPuzzle.dateStringToDate("alkja;ds lajsd;f alsf"), null,
                 "Random text should not return a date");
});

QUnit.test("dateRangeToDates", function(assert) {
    function assertValidDateRange(datePair, start, end, message) {
        assert.notEqual(datePair, null, message);
        assert.equal(datePair.length, 2, message);
        assert.ok(datePair[0] <= datePair[1], message);
        assert.equal(datePair[0].getTime(), start.getTime(), message);
        assert.equal(datePair[1].getTime(), end.getTime(), message);
    }

    var dates = BlockPuzzle.dateRangeToDates("01/01/2001-02/03/2012");
    assertValidDateRange(dates,
                         new Date(2001, 0, 1, 0, 0, 0, 0),
                         new Date(2012, 2, 2, 0, 0, 0, 0),
                         "Simple date range.");

    var dates = BlockPuzzle.dateRangeToDates("02/03/2012-01/01/2001");
    assertValidDateRange(dates,
                         new Date(2001, 0, 1, 0, 0, 0, 0),
                         new Date(2012, 2, 2, 0, 0, 0, 0),
                         "Proper ordering when range goes backward in time.");

    var dates = BlockPuzzle.dateRangeToDates("Q1/2001");
    assertValidDateRange(dates,
                         new Date(2001, 0, 1, 0, 0, 0, 0),
                         new Date(2001, 2, 31, 0, 0, 0, 0),
                         "Simple quarter.");

    var dates = BlockPuzzle.dateRangeToDates("Q1/2001-Q1/2001");
    assertValidDateRange(dates,
                         new Date(2001, 0, 1, 0, 0, 0, 0),
                         new Date(2001, 2, 31, 0, 0, 0, 0),
                         "Quarter range.");

    var dates = BlockPuzzle.dateRangeToDates("Q1");
    assert.strictEqual(dates, null, "Invalid quarter string");
});