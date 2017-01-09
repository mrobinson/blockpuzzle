/*
 * Copyright 2015 Martin Robinson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var emptyData = {
    tracks: [ ]
};

QUnit.test("convertTextToData values", function(assert) {
    var data = BlockPuzzle.convertTextToData("value: nice");
    assert.propEqual(data, {tracks: [], value: "nice"});

    data = BlockPuzzle.convertTextToData("value: 42");
    assert.propEqual(data, {tracks: [], value: "42"}, "Simple example");

    data = BlockPuzzle.convertTextToData("value: \twhitespace\tin\tthe\tmiddle\t");
    assert.propEqual(data, {tracks: [], value: "whitespace\tin\tthe\tmiddle"}, "Whitespace should be trimmed");

    data = BlockPuzzle.convertTextToData("value: a longer string with spaces");
    assert.propEqual(data, {tracks: [], value: "a longer string with spaces"}, "Simple example with spaces");
});

QUnit.test("convertTextToData tracks", function(assert) {
    var simpleTrack = {
        tracks: [ { name: 'user1', reservations: []} ],
        value: "42",
    };

    var data = BlockPuzzle.convertTextToData("value: 42\n* user1\n");
    assert.propEqual(data, simpleTrack, "Whitespace shouldn't matter");

    data = BlockPuzzle.convertTextToData("value: 42\n*\tuser1\t\n");
    assert.propEqual(data, simpleTrack, "Whitespace shouldn't matter.");

    data = BlockPuzzle.convertTextToData("value: 42\n*user1");
    assert.propEqual(data, simpleTrack, "Whitespace shouldn't matter.");

    data = BlockPuzzle.convertTextToData("*user1\nvalue: 42\n");
    assert.propEqual(data, simpleTrack, "Order shouldn't matter.");

    var simpleTrack2 = {
        tracks: [ { name: 'User One', reservations: []} ],
    };

    data = BlockPuzzle.convertTextToData(" * User One ");
    assert.propEqual(data, simpleTrack2, "Track name should support whitespace.");

    var multipleTracks = {
        tracks: [
            { name: 'User One', reservations: []},
            { name: 'User Two', reservations: []},
            { name: 'User Three', reservations: []},
        ],
    };

    data = BlockPuzzle.convertTextToData(" * User One \n * User Two\t\n* User Three\t");
    assert.propEqual(data, multipleTracks, "Multiple tracks.");

    data = BlockPuzzle.convertTextToData(" * \t\t");
    assert.propEqual(data, emptyData, "Don't add track with empty track name.");
});

QUnit.test("convertTextToData reservations", function(assert) {
    var simpleReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One',  
                              confirmed: true,
                              hours: null,
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
                              confirmed: true,
                              hours: null,
                              start: new Date(2009, 0, 21, 0, 0, 0, 0),
                              end: new Date(2009, 1, 23, 0, 0, 0, 0) } ],
        } ],
    };

    data = BlockPuzzle.convertTextToData("* User One\n - Reservation One: 1/21/2009-2/23/2009");
    assert.propEqual(data, rangeReservation, "Reservation with more complex range");

    rangeReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One',
                              confirmed: true,
                              hours: 30,
                              start: new Date(2009, 5, 1, 0, 0, 0, 0),
                              end: new Date(2009, 11, 31, 0, 0, 0, 0) } ],
        } ],
    };

    data = BlockPuzzle.convertTextToData("* User One\n - Reservation One: Q3/2009-Q4/2009, 30hrs");
    assert.propEqual(data, rangeReservation, "Reservation with more complex range");
    data = BlockPuzzle.convertTextToData(" - Reservation One: Q3/2009-Q4/2009, 30");
    assert.propEqual(data, emptyData, "Don't add data when there is no current track.");
    data = BlockPuzzle.convertTextToData("\t\n - \tReservation One: Q3/2009-Q4/2009, 30 hrs");
    assert.propEqual(data, emptyData, "Don't add data when there is no current track.");

    var emptyTrack = {
        tracks: [ {
            name: 'User One',
            reservations: [ ],
        } ],
    };

    data = BlockPuzzle.convertTextToData("* User One\n - \t: Q3-Q4");
    assert.propEqual(data, emptyTrack, "Don't add reservation when the name is empty.");

    unconfirmedRangeReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One',
                              confirmed: false,
                              hours: 30,
                              start: new Date(2009, 5, 1, 0, 0, 0, 0),
                              end: new Date(2009, 11, 31, 0, 0, 0, 0) } ],
        } ],
    };

    data = BlockPuzzle.convertTextToData("* User One\n + Reservation One: Q3/2009-Q4/2009, 30hrs");
    assert.propEqual(data, unconfirmedRangeReservation,
                     "Unconfirmed Reservation with more complex range");
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
    assert.equal(BlockPuzzle.dateStringToDate("12/2012").getTime(),
                 (new Date(2012, 11, 1, 0, 0, 0, 0)).getTime(),
                 "Simple month date.");
    assert.equal(BlockPuzzle.dateStringToDate("alkja;ds lajsd;f alsf"), null,
                 "Random text should not return a date");
});

QUnit.test("dateRangeToDates", function(assert) {
    function assertValidDateRange(datePair, start, end, message) {
        assert.notEqual(datePair, null, message + " (not null)");
        assert.equal(datePair.length, 2, message + " (length 2)");
        assert.ok(datePair[0] <= datePair[1], message + " (earliest first)");
        assert.equal(datePair[0].getTime(), start.getTime(), message + " (first equal)");
        assert.equal(datePair[1].getTime(), end.getTime(), message + " (second equal)");
    }

    assertValidDateRange(BlockPuzzle.dateRangeToDates("01/01/2001-02/03/2012"),
                         new Date(2001, 0, 1, 0, 0, 0, 0),
                         new Date(2012, 2, 2, 0, 0, 0, 0),
                         "Simple date range.");
    assertValidDateRange(BlockPuzzle.dateRangeToDates("02/03/2012-01/01/2001"),
                         new Date(2001, 0, 1, 0, 0, 0, 0),
                         new Date(2012, 2, 2, 0, 0, 0, 0),
                         "Proper ordering when range goes backward in time.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("Q1/2001"),
                         new Date(2001, 0, 1, 0, 0, 0, 0),
                         new Date(2001, 2, 31, 0, 0, 0, 0),
                         "Simple quarter.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("Q1/2001-Q1/2001"),
                         new Date(2001, 0, 1, 0, 0, 0, 0),
                         new Date(2001, 2, 31, 0, 0, 0, 0),
                         "Quarter range.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("02/2001-05/2001"),
                         new Date(2001, 1, 1, 0, 0, 0, 0),
                         new Date(2001, 4, 1, 0, 0, 0, 0),
                         "Month range.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("02/2001-05/05/2001"),
                         new Date(2001, 1, 1, 0, 0, 0, 0),
                         new Date(2001, 4, 5, 0, 0, 0, 0),
                         "Month range with date on one end.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("H1/2001"),
                         new Date(2001, 0, 1, 0, 0, 0, 0),
                         new Date(2001, 5, 30, 0, 0, 0, 0),
                         "Simple half.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("H1/2001-H1/2002"),
                         new Date(2001, 0, 1, 0, 0, 0, 0),
                         new Date(2002, 5quarterYear, 30, 0, 0, 0, 0),
                         "Half range.");

    assert.strictEqual(BlockPuzzle.dateRangeToDates("Q1"), null, "Invalid quarter string");
});

QUnit.test("Canvas.hoursStringtoHours", function(assert) {
    assert.strictEqual(BlockPuzzle.hoursStringToHours("24"), 24,
                       "Simple integer hours");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("24."), 24,
                       "Simple integer hours with decimal point");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("24.456"), 24.456,
                       "Simple decimal hours");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("24.456 hrs"), 24.456,
                       "Simple decimal hours with 'hrs'");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("24.456hrs"), 24.456,
                       "Simple decimal hours with 'hrs' attached");
});

QUnit.test("Canvas.addData", function(assert) {
    var simpleReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One',
                              hours: null,
                              start: new Date(2001, 0, 1, 0, 0, 0, 0),
                              end: new Date(2001, 2, 31, 0, 0, 0, 0) } ],
        } ],
    };
    var canvas = new BlockPuzzle.Canvas(null);
    canvas.setData(simpleReservation);
    canvas.setData(simpleReservation);

    assert.equal(canvas.tracks.length, 1, "setData clears old data");
});

QUnit.test("Slice.calculateHoursForReservations", function(assert) {
    var start = new Date();
    var end = new Date();
    end.setDate(end.getDate() + 30);

    var slice = new BlockPuzzle.Slice(start, end);

    var reservation1 = new BlockPuzzle.Reservation("Project1", start, end, null);
    var reservation2 = new BlockPuzzle.Reservation("Project2", start, end, null);
    slice.reservations = [ reservation1, reservation2 ];
    slice.calculateHoursForReservations();
    assert.equal(slice.getHoursAllocatedForReservation(reservation1),
                 17.5, "Two reservations with undefined hours");
    assert.equal(slice.getHoursAllocatedForReservation(reservation2),
                 17.5, "Two reservations with undefined hours");
    assert.equal(slice.unusedHours, 5, "Two reservations with undefined hours");
    assert.equal(slice.totalHoursReserved(), 40, "Two reservations with undefined hours");

    var reservation3 = new BlockPuzzle.Reservation("Project1", start, end, 10);
    slice.reservations = [ reservation1, reservation2, reservation3 ];
    slice.calculateHoursForReservations();
    assert.equal(slice.getHoursAllocatedForReservation(reservation1),
                 12.5, "One reservation with defined hours");
    assert.equal(slice.getHoursAllocatedForReservation(reservation2),
                 12.5, "One reservation with defined hours");
    assert.equal(slice.getHoursAllocatedForReservation(reservation3),
                 10, "One reservation with defined hours");
    assert.equal(slice.unusedHours, 5, "One reservation with defined hours");
    assert.equal(slice.totalHoursReserved(), 40, "One reservation with defined hours");

    var reservation4 = new BlockPuzzle.Reservation("Project1", start, end, 55);
    slice.reservations = [ reservation1, reservation4 ];
    slice.calculateHoursForReservations();
    assert.equal(slice.getHoursAllocatedForReservation(reservation1),
                 0, "A reservation that takes all available hours");
    assert.equal(slice.getHoursAllocatedForReservation(reservation4),
                 55, "A reservation that takes all available hours");
    assert.equal(slice.unusedHours, 0, "A reservation that takes all available hours");
    assert.equal(slice.totalHoursReserved(), 55, "A reservation that takes all available hours");

    var reservation5 = new BlockPuzzle.Reservation("Project1", start, end, 55);
    slice.reservations = [ reservation4, reservation5 ];
    slice.calculateHoursForReservations();
    assert.equal(slice.getHoursAllocatedForReservation(reservation1),
                 0, "Two reservations that exceed the total hours");
    assert.equal(slice.getHoursAllocatedForReservation(reservation4),
                 55, "Two reservations that exceed the total hours");
    assert.equal(slice.unusedHours, 0, "Two reservations that exceed the total hours");
    assert.equal(slice.totalHoursReserved(), 110, "Two reservations that exceed the total hours");
});

QUnit.test("Track.buildSlices", function(assert) {
    var track = new BlockPuzzle.Track("Test", new Date(2014, 0, 1), new Date(2014, 11, 31));
    track.setReservations([
        new BlockPuzzle.Reservation("A", new Date(2014, 0, 20), new Date(2014, 0, 31)),
        new BlockPuzzle.Reservation("B", new Date(2014, 5, 10), new Date(2014, 6, 20))]);

    function assertSliceStartAndEnd(slice, start, end, message) {
        assert.equal(slice.start.getTime(), start.getTime(), message + " - start correct");
        assert.equal(slice.end.getTime(), end.getTime(), message + " - end correct");
    }

    var message = "Slices for non-overlapping reservations";
    assert.equal(track.slices.length, 5, message);
    assertSliceStartAndEnd(track.slices[0], new Date(2014, 0, 1), new Date(2014, 0, 19), message);
    assertSliceStartAndEnd(track.slices[1], new Date(2014, 0, 20), new Date(2014, 0, 31), message);
    assertSliceStartAndEnd(track.slices[2], new Date(2014, 1, 1), new Date(2014, 5, 9), message);
    assertSliceStartAndEnd(track.slices[3], new Date(2014, 5, 10), new Date(2014, 6, 20), message);
    assertSliceStartAndEnd(track.slices[4], new Date(2014, 6, 21), new Date(2014, 11, 31), message);

    track = new BlockPuzzle.Track("Test2", new Date(2014, 0, 1), new Date(2014, 11, 31));
    track.setReservations([
        new BlockPuzzle.Reservation("A", new Date(2014, 0, 20), new Date(2014, 3, 30)),
        new BlockPuzzle.Reservation("B", new Date(2014, 1, 15), new Date(2014, 4, 10))]);
    message = "Slices for overlapping reservations";
    assert.equal(track.slices.length, 5, message);
    assertSliceStartAndEnd(track.slices[0], new Date(2014, 0, 1), new Date(2014, 0, 19), message);
    assertSliceStartAndEnd(track.slices[1], new Date(2014, 0, 20), new Date(2014, 1, 14), message);
    assertSliceStartAndEnd(track.slices[2], new Date(2014, 1, 15), new Date(2014, 3, 30), message);
    assertSliceStartAndEnd(track.slices[3], new Date(2014, 4, 1), new Date(2014, 4, 10), message);
    assertSliceStartAndEnd(track.slices[4], new Date(2014, 4, 11), new Date(2014, 11, 31), message);

    track = new BlockPuzzle.Track("Test3", new Date(2014, 0, 1), new Date(2014, 11, 31));
    track.setReservations([
        new BlockPuzzle.Reservation("A", new Date(2014, 0, 1), new Date(2014, 0, 20)),
        new BlockPuzzle.Reservation("B", new Date(2014, 4, 1), new Date(2014, 5, 30)),
        new BlockPuzzle.Reservation("C", new Date(2014, 2, 1), new Date(2014, 9, 31)),
        new BlockPuzzle.Reservation("D", new Date(2014, 7, 1), new Date(2014, 8, 30)),
        new BlockPuzzle.Reservation("E", new Date(2014, 4, 1), new Date(2014, 5, 30))]);

    message = "Complex slices";
    assert.equal(track.slices.length, 8, message);
    assertSliceStartAndEnd(track.slices[0], new Date(2014, 0, 1), new Date(2014, 0, 20), message);
    assertSliceStartAndEnd(track.slices[1], new Date(2014, 0, 21), new Date(2014, 1, 28), message);
    assertSliceStartAndEnd(track.slices[2], new Date(2014, 2, 1), new Date(2014, 3, 30), message);
    assertSliceStartAndEnd(track.slices[3], new Date(2014, 4, 1), new Date(2014, 5, 30), message);
    assertSliceStartAndEnd(track.slices[4], new Date(2014, 6, 1), new Date(2014, 6, 31), message);
    assertSliceStartAndEnd(track.slices[5], new Date(2014, 7, 1), new Date(2014, 8, 30), message);
    assertSliceStartAndEnd(track.slices[6], new Date(2014, 9, 1), new Date(2014, 9, 31), message);
    assertSliceStartAndEnd(track.slices[7], new Date(2014, 10, 1), new Date(2014, 11, 31), message);
});
